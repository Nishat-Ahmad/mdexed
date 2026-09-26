import fs from 'fs';
import { execSync } from 'child_process';

const blogGitDir = 'src/content/blog/.git';
const repoUrl = 'https://github.com/Nishat-Ahmad/mdexed-content.git';

if (!fs.existsSync(blogGitDir)) {
  console.log('INFO: Cloning blog content repo...');
  try {
    execSync(`git clone ${repoUrl} src/content/blog`, { stdio: 'inherit' });
  } catch (error) {
    console.warn('WARN: Failed to clone blog content. Check your internet connection.');
  }
} else {
  console.log('INFO: Updating blog content...');
  try {
    execSync('git -C src/content/blog pull origin main', { stdio: 'inherit' });
  } catch (error) {
    console.warn('WARN: Could not pull latest blog content (offline or connection issue). Continuing with local notes.');
  }
}
