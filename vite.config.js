import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom helper to scan directories recursively for markdown files and empty folders
const getFilesRecursively = (dir, baseDir) => {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

  list.forEach(item => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const subResults = getFilesRecursively(fullPath, baseDir);
      results = results.concat(subResults);
      
      const hasMd = subResults.some(r => !r.isEmptyFolder);
      if (!hasMd) {
        const subItems = fs.readdirSync(fullPath);
        const imgFiles = subItems.filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));
        const relativeName = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        results.push({ isEmptyFolder: true, name: relativeName, images: imgFiles });
      }
    } else if (item.isFile() && item.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      
      let slug = relativePath.substring(0, relativePath.length - 3);
      const parts = slug.split('/');
      if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
        parts.pop();
        slug = parts.join('/');
      }
      
      const parentDir = path.dirname(fullPath);
      const subItems = fs.readdirSync(parentDir);
      const imgFiles = subItems.filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));
      
      results.push({ filename: slug, content, images: imgFiles });
    }
  });
  
  return results;
};

// Custom helper to search for an image file recursively
const findImageRecursively = (dir, targetFileName) => {
  if (!fs.existsSync(dir)) return null;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const found = findImageRecursively(fullPath, targetFileName);
      if (found) return found;
    } else if (item.isFile() && item.name.toLowerCase() === targetFileName.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
};

// Custom Vite plugin to handle local file system saving/loading
const localFileSystemApi = () => {
  return {
    name: 'local-fs-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Handle Image Upload
        if (req.url === '/api/upload-image' && req.method === 'POST') {
          try {
            const folderName = decodeURIComponent(req.headers['x-folder-name']);
            const fileName = decodeURIComponent(req.headers['x-file-name']);
            
            if (!folderName || !fileName) {
              res.statusCode = 400;
              res.end('Missing X-Folder-Name or X-File-Name headers');
              return;
            }
            
            const targetDir = path.resolve(process.cwd(), 'src', 'content', 'blog', folderName);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            
            const targetFilePath = path.join(targetDir, fileName);
            const writeStream = fs.createWriteStream(targetFilePath);
            
            req.pipe(writeStream);
            
            req.on('end', () => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: `Saved to ${folderName}/${fileName}` }));
            });
            
            writeStream.on('error', (err) => {
              res.statusCode = 500;
              res.end(`Write error: ${err.message}`);
            });
          } catch (err) {
            res.statusCode = 500;
            res.end(`Server error: ${err.message}`);
          }
          return;
        }

        // Handle Save
        if (req.url === '/api/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { slug, content } = JSON.parse(body);
              const blogDir = path.resolve(process.cwd(), 'src', 'content', 'blog');
              
              let targetPath;
              if (slug.includes('/')) {
                // Save directly as a flat file in the parent folder
                targetPath = path.resolve(blogDir, `${slug}.md`);
              } else {
                // Save using folder-per-post architecture
                targetPath = path.resolve(blogDir, slug, `${slug}.md`);
              }
              
              const dir = path.dirname(targetPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(targetPath, content);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: `Saved to src/content/blog/${path.relative(blogDir, targetPath).replace(/\\/g, '/')}` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        
        // Handle Mkdir
        if (req.url === '/api/mkdir' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { folderName } = JSON.parse(body);
              const dir = path.resolve(process.cwd(), 'src', 'content', 'blog', folderName);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Handle Delete
        if (req.url === '/api/delete' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { target } = JSON.parse(body);
              const blogDir = path.resolve(process.cwd(), 'src', 'content', 'blog');
              const dir = path.resolve(blogDir, target);
              const flatFile = path.resolve(blogDir, `${target}.md`);
              
              if (fs.existsSync(dir) && fs.statSync(dir).isDirectory() && dir.startsWith(blogDir)) {
                fs.rmSync(dir, { recursive: true, force: true });
              } else if (fs.existsSync(flatFile) && flatFile.startsWith(blogDir)) {
                fs.rmSync(flatFile, { force: true });
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Handle Rename
        if (req.url === '/api/rename' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { oldName, newName } = JSON.parse(body);
              const blogDir = path.resolve(process.cwd(), 'src', 'content', 'blog');
              const oldDir = path.join(blogDir, oldName);
              const newDir = path.join(blogDir, newName);
              const oldFlatFile = path.join(blogDir, `${oldName}.md`);
              const newFlatFile = path.join(blogDir, `${newName}.md`);
              
              if (fs.existsSync(oldDir) && fs.statSync(oldDir).isDirectory()) {
                fs.renameSync(oldDir, newDir);
                
                // If it contains a markdown file matching the old folder name, rename that too
                const oldMdName = `${path.basename(oldName)}.md`;
                const newMdName = `${path.basename(newName)}.md`;
                const oldMd = path.join(newDir, oldMdName);
                const newMd = path.join(newDir, newMdName);
                if (fs.existsSync(oldMd)) {
                  fs.renameSync(oldMd, newMd);
                }
              } else if (fs.existsSync(oldFlatFile)) {
                fs.renameSync(oldFlatFile, newFlatFile);
              }
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Handle Load
        if (req.url === '/api/files' && req.method === 'GET') {
          const blogDir = path.resolve(process.cwd(), 'src', 'content', 'blog');
          if (!fs.existsSync(blogDir)) {
             fs.mkdirSync(blogDir, { recursive: true });
          }
          
          const fileData = getFilesRecursively(blogDir, blogDir);
          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(fileData));
          return;
        }

        // Handle Image Delete
        if (req.url === '/api/delete-image' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { folderName, imageName } = JSON.parse(body);
              const imgPath = path.resolve(process.cwd(), 'src', 'content', 'blog', folderName, imageName);
              if (fs.existsSync(imgPath) && imgPath.startsWith(path.resolve(process.cwd(), 'src', 'content', 'blog'))) {
                fs.rmSync(imgPath, { force: true });
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } else {
                res.statusCode = 404;
                res.end('Image not found');
              }
            } catch (err) {
              res.statusCode = 500;
              res.end(err.message);
            }
          });
          return;
        }

        // Handle Image Rename
        if (req.url === '/api/rename-image' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { folderName, oldImageName, newImageName } = JSON.parse(body);
              const blogDir = path.resolve(process.cwd(), 'src', 'content', 'blog');
              const oldImgPath = path.resolve(blogDir, folderName, oldImageName);
              
              if (!oldImgPath.startsWith(blogDir)) {
                res.statusCode = 403;
                res.end('Access denied');
                return;
              }
              
              if (!fs.existsSync(oldImgPath)) {
                res.statusCode = 404;
                res.end('Image not found');
                return;
              }
              
              const ext = path.extname(oldImageName);
              let cleanNewName = newImageName.trim();
              if (!path.extname(cleanNewName)) {
                cleanNewName += ext;
              }
              
              const newImgPath = path.resolve(blogDir, folderName, cleanNewName);
              if (!newImgPath.startsWith(blogDir)) {
                res.statusCode = 403;
                res.end('Access denied');
                return;
              }
              
              if (fs.existsSync(newImgPath) && oldImgPath !== newImgPath) {
                res.statusCode = 400;
                res.end('A file with that name already exists');
                return;
              }
              
              fs.renameSync(oldImgPath, newImgPath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, newName: cleanNewName }));
            } catch (err) {
              res.statusCode = 500;
              res.end(err.message);
            }
          });
          return;
        }

        // Intercept image requests to serve local images from the filesystem
        const ext = path.extname(req.url.split('?')[0]).toLowerCase();
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
        
        if (imageExtensions.includes(ext)) {
          const decodedUrl = decodeURI(req.url.split('?')[0]);
          const fileName = path.basename(decodedUrl);
          const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
          
          let foundPath = null;
          
          if (fs.existsSync(blogDir)) {
            foundPath = findImageRecursively(blogDir, fileName);
          }
          
          // Fallback to project root
          if (!foundPath) {
             const rootPath = path.join(process.cwd(), decodedUrl);
             if (fs.existsSync(rootPath) && fs.statSync(rootPath).isFile()) {
               foundPath = rootPath;
             }
          }

          if (foundPath) {
            const stream = fs.createReadStream(foundPath);
            
            let contentType = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            if (ext === '.gif') contentType = 'image/gif';
            if (ext === '.svg') contentType = 'image/svg+xml';
            if (ext === '.webp') contentType = 'image/webp';
            
            res.setHeader('Content-Type', contentType);
            res.statusCode = 200;
            stream.pipe(res);
            return;
          }
        }
        
        next();
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), localFileSystemApi()],
})
