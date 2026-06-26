import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom Vite plugin to handle local file system saving/loading
const localFileSystemApi = () => {
  return {
    name: 'local-fs-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Handle Save
        if (req.url === '/api/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { slug, content } = JSON.parse(body);
              // Save to src/content/blog/slug/slug.md
              const dir = path.resolve(process.cwd(), 'src', 'content', 'blog', slug);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(path.join(dir, `${slug}.md`), content);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: `Saved to src/content/blog/${slug}/${slug}.md` }));
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
              const dir = path.resolve(process.cwd(), 'src', 'content', 'blog', target);
              const flatFile = path.resolve(process.cwd(), 'src', 'content', 'blog', `${target}.md`);
              
              if (fs.existsSync(dir) && fs.statSync(dir).isDirectory() && dir.startsWith(path.resolve(process.cwd(), 'src', 'content', 'blog'))) {
                fs.rmSync(dir, { recursive: true, force: true });
              } else if (fs.existsSync(flatFile) && flatFile.startsWith(path.resolve(process.cwd(), 'src', 'content', 'blog'))) {
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
                const oldMd = path.join(newDir, `${oldName}.md`);
                const newMd = path.join(newDir, `${newName}.md`);
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
          
          const fileData = [];
          const items = fs.readdirSync(blogDir, { withFileTypes: true });
          
          items.forEach(item => {
            if (item.isDirectory()) {
              const subDir = path.join(blogDir, item.name);
              const subItems = fs.readdirSync(subDir).filter(f => f.endsWith('.md'));
              if (subItems.length === 0) {
                fileData.push({ isEmptyFolder: true, name: item.name });
              } else {
                subItems.forEach(f => {
                  const content = fs.readFileSync(path.join(subDir, f), 'utf-8');
                  fileData.push({ filename: item.name, content }); // slug is the folder name
                });
              }
            } else if (item.isFile() && item.name.endsWith('.md')) {
              const content = fs.readFileSync(path.join(blogDir, item.name), 'utf-8');
              fileData.push({ filename: item.name.replace('.md', ''), content });
            }
          });
          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(fileData));
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
          
          // 1. Search dynamically inside subfolders of src/content/blog
          if (fs.existsSync(blogDir)) {
             const items = fs.readdirSync(blogDir, { withFileTypes: true });
             for (const item of items) {
               if (item.isDirectory()) {
                  const checkPath = path.join(blogDir, item.name, fileName);
                  if (fs.existsSync(checkPath)) {
                     foundPath = checkPath;
                     break;
                  }
               }
             }
             // 2. Fallback to flat blog directory
             if (!foundPath) {
               const flatPath = path.join(blogDir, fileName);
               if (fs.existsSync(flatPath)) foundPath = flatPath;
             }
          }
          
          // 3. Fallback to project root
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
