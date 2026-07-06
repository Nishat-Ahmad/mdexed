import { useState, useEffect, useRef, useCallback } from 'react';
import { generateMarkdown, parseMarkdownFile } from '../utils/markdown';

const REPO_OWNER = 'Nishat-Ahmad';
const REPO_NAME = 'mdexed-content';
const BRANCH = 'main';

const DEFAULT_BODY = `
# Introduction
Your markdown content starts here...
`;

export function useGitHubFileSystem() {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [emptyFolders, setEmptyFolders] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [folderImages, setFolderImages] = useState({});
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github_pat') || '');
  
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const filesRef = useRef(files);
  filesRef.current = files;
  
  const lastSavedContentRef = useRef({});
  const prevActiveFileIdRef = useRef(activeFileId);

  // Initialize token prompt
  useEffect(() => {
    if (!githubToken) {
      const token = prompt("Enter your GitHub Personal Access Token to access mdexed-content:");
      if (token) {
        localStorage.setItem('github_pat', token);
        setGithubToken(token);
      }
    }
  }, [githubToken]);

  const apiHeaders = useCallback(() => ({
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }), [githubToken]);

  const loadFiles = useCallback(async () => {
    if (!githubToken) return;
    try {
      // 1. Get the branch to find the tree SHA
      const branchRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}`, { headers: apiHeaders() });
      if (!branchRes.ok) throw new Error("Failed to fetch branch");
      const branchData = await branchRes.json();
      const treeSha = branchData.commit.commit.tree.sha;

      // 2. Get the tree recursively
      const treeRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${treeSha}?recursive=1`, { headers: apiHeaders() });
      const treeData = await treeRes.json();

      const mdFiles = treeData.tree.filter(item => item.type === 'blob' && item.path.endsWith('.md'));
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
      const imgFiles = treeData.tree.filter(item => item.type === 'blob' && imageExtensions.some(ext => item.path.toLowerCase().endsWith(ext)));

      const loadedFiles = [];
      const savedMap = {};
      const loadedFolderImages = {};

      // Map images to folders
      imgFiles.forEach(img => {
        const parts = img.path.split('/');
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        const name = parts[parts.length - 1];
        if (!loadedFolderImages[folder]) loadedFolderImages[folder] = [];
        loadedFolderImages[folder].push(name);
      });

      // 3. Fetch content for each md file
      const fetchPromises = mdFiles.map(async (fileNode) => {
        const contentRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileNode.path}`, {
          headers: { ...apiHeaders(), 'Accept': 'application/vnd.github.raw+json' }
        });
        const rawText = await contentRes.text();
        
        const parsed = parseMarkdownFile(rawText);
        let slug = fileNode.path.substring(0, fileNode.path.length - 3);
        
        // Handle folder/folder.md pattern
        const parts = slug.split('/');
        if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
          parts.pop();
          slug = parts.join('/');
        }

        savedMap[slug] = rawText;
        loadedFiles.push({ id: slug, frontmatter: parsed.frontmatter, body: parsed.body, githubPath: fileNode.path });
      });

      await Promise.all(fetchPromises);

      lastSavedContentRef.current = savedMap;
      setFolderImages(loadedFolderImages);
      
      if (loadedFiles.length > 0) {
        setFiles(loadedFiles);
        setActiveFileId(currentId => {
          if (currentId && loadedFiles.some(f => f.id === currentId)) {
            prevActiveFileIdRef.current = currentId;
            return currentId;
          }
          prevActiveFileIdRef.current = loadedFiles[0].id;
          return loadedFiles[0].id;
        });
      }
    } catch (err) {
      console.error("Could not load from GitHub", err);
    }
  }, [githubToken, apiHeaders]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const saveFileContent = useCallback(async (slug, content) => {
    if (!githubToken) return false;
    setSaveStatus('saving');
    try {
      // Determine path
      let targetPath = slug.includes('/') ? `${slug}/${slug.split('/').pop()}.md` : `${slug}/${slug}.md`;
      const existingFile = filesRef.current.find(f => f.id === slug);
      if (existingFile && existingFile.githubPath) {
        targetPath = existingFile.githubPath;
      }

      // Check if file exists to get its SHA (required for updating)
      let sha = undefined;
      const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPath}`, { headers: apiHeaders() });
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }

      // Encode content to base64 with utf-8 support
      const base64Content = btoa(unescape(encodeURIComponent(content)));

      // Commit file
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPath}`, {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({
          message: `Update ${slug} via mdexed cloud`,
          content: base64Content,
          sha: sha,
          branch: BRANCH
        })
      });

      if (res.ok) {
        lastSavedContentRef.current[slug] = content;
        if (activeFileId === slug) setSaveStatus('saved');
        return true;
      } else {
        setSaveStatus('error');
        return false;
      }
    } catch (e) {
      console.error("GitHub save error", e);
      setSaveStatus('error');
      return false;
    }
  }, [activeFileId, githubToken, apiHeaders]);

  // Debounced Autosave Effect
  useEffect(() => {
    if (!activeFile) return;
    const currentContent = generateMarkdown(activeFile.frontmatter, activeFile.body);
    const lastSaved = lastSavedContentRef.current[activeFile.id];

    if (prevActiveFileIdRef.current !== activeFile.id) {
      const prevId = prevActiveFileIdRef.current;
      const prevFile = filesRef.current.find(f => f.id === prevId);
      if (prevFile) {
        const prevContent = generateMarkdown(prevFile.frontmatter, prevFile.body);
        const prevLastSaved = lastSavedContentRef.current[prevId];
        if (prevContent !== prevLastSaved) {
          saveFileContent(prevId, prevContent);
        }
      }
      prevActiveFileIdRef.current = activeFile.id;
      setSaveStatus(currentContent === lastSaved ? 'saved' : 'unsaved');
      return;
    }

    if (currentContent === lastSaved) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('unsaved');
    const delayDebounceFn = setTimeout(() => {
      saveFileContent(activeFile.id, currentContent);
    }, 2000);

    return () => clearTimeout(delayDebounceFn);
  }, [activeFileId, activeFile, saveFileContent]);

  const updateActiveFile = (updates) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, ...updates } : f));
  };

  const createNewFile = (parentFolder = '') => {
    let slug = prompt("Enter post URL slug (e.g., my-new-post):");
    if (!slug) return;
    slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const fullSlug = parentFolder ? `${parentFolder}/${slug}` : slug;
    
    if (files.find(f => f.id === fullSlug)) {
       alert("That name already exists!"); return;
    }
    const newFile = {
      id: fullSlug,
      frontmatter: {
        title: slug.replace(/-/g, ' '),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        readTime: "5 min read",
        summary: "",
        tags: []
      },
      body: "# New Post\n\nStart writing here..."
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleFileUpload = () => {};
  const createNewFolder = () => {};

  const deleteItem = async (e, targetId, isFile) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to completely delete "${targetId}"?`)) return;
    
    const fileToDelete = files.find(f => f.id === targetId);
    if (!fileToDelete || !fileToDelete.githubPath) return;

    try {
      const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileToDelete.githubPath}`, { headers: apiHeaders() });
      if (getRes.ok) {
        const getData = await getRes.json();
        await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileToDelete.githubPath}`, {
          method: 'DELETE',
          headers: apiHeaders(),
          body: JSON.stringify({
            message: `Delete ${targetId}`,
            sha: getData.sha,
            branch: BRANCH
          })
        });
      }
      
      setFiles(prev => prev.filter(f => f.id !== targetId));
      delete lastSavedContentRef.current[targetId];
      if (activeFileId === targetId) {
        const remaining = files.filter(f => f.id !== targetId);
        setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) { console.error(err); }
  };

  const renameItem = async () => { alert("Renaming not fully supported in cloud yet. Create a new file instead."); return null; };
  
  const handleSaveToDisk = async () => {
    if (!activeFile) return;
    const currentContent = generateMarkdown(activeFile.frontmatter, activeFile.body);
    await saveFileContent(activeFile.id, currentContent);
  };

  const uploadImage = async (folderName, file, fileName) => {
    if (!githubToken) return false;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        const targetPath = `${folderName}/${fileName}`;
        
        try {
          const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPath}`, {
            method: 'PUT',
            headers: apiHeaders(),
            body: JSON.stringify({
              message: `Upload image ${fileName}`,
              content: base64data,
              branch: BRANCH
            })
          });
          if (res.ok) {
            await loadFiles();
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (e) {
          resolve(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return {
    files, emptyFolders, activeFileId, setActiveFileId, activeFile,
    updateActiveFile, createNewFile, handleFileUpload, createNewFolder,
    deleteItem, renameItem, handleSaveToDisk, saveStatus,
    folderImages, loadFiles, uploadImage
  };
}
