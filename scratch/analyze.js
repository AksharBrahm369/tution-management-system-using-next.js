const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else {
      fileList.push(name);
    }
  }
  return fileList;
}

const appDir = path.join(__dirname, '..', 'app');
const results = {
  adminAuthWarnings: [],
  studentIsolationWarnings: [],
  parentIsolationWarnings: [],
  missingDynamicPages: []
};

// 1. Admin Auth Check
const adminApiDir = path.join(appDir, 'api', 'admin');
if (fs.existsSync(adminApiDir)) {
  const files = getFiles(adminApiDir).filter(f => f.endsWith('route.ts'));
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(appDir, file);
    const hasAuthCheck = content.includes('requireSuperAdmin') || 
                         content.includes('requireAdmin') ||
                         content.includes('requireRole') || 
                         content.includes('validateJWT') || 
                         content.includes('verifyAuth');
    if (!hasAuthCheck) {
      results.adminAuthWarnings.push(relativePath);
    }
  });
}

// 2. Student Data Isolation Check
const studentApiDir = path.join(appDir, 'api', 'student');
if (fs.existsSync(studentApiDir)) {
  const files = getFiles(studentApiDir).filter(f => f.endsWith('route.ts'));
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(appDir, file);
    const usesRequireStudent = content.includes('requireStudent');
    const usesStudentId = content.includes('studentId') || content.includes('student.id');
    if (!usesRequireStudent || !usesStudentId) {
      results.studentIsolationWarnings.push({ file: relativePath, usesRequireStudent, usesStudentId });
    }
  });
}

// 3. Parent Data Isolation Check
const parentApiDir = path.join(appDir, 'api', 'parent');
if (fs.existsSync(parentApiDir)) {
  const files = getFiles(parentApiDir).filter(f => f.endsWith('route.ts'));
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(appDir, file);
    const usesRequireParent = content.includes('requireParent');
    const usesParentId = content.includes('parentId');
    if (!usesRequireParent || !usesParentId) {
      results.parentIsolationWarnings.push({ file: relativePath, usesRequireParent, usesParentId });
    }
  });
}

// 4. Dynamic Export Check
const dashboardDir = path.join(appDir, '(dashboard)');
if (fs.existsSync(dashboardDir)) {
  const files = getFiles(dashboardDir).filter(f => f.endsWith('page.tsx'));
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(appDir, file);
    const hasDynamic = content.includes('export const dynamic =');
    if (!hasDynamic) {
      results.missingDynamicPages.push(relativePath);
    }
  });
}

console.log('=== ANALYSIS RESULTS ===');
console.log('\nMissing Admin Auth (api/admin):');
results.adminAuthWarnings.forEach(w => console.log(` - ${w}`));

console.log('\nStudent Isolation Warnings (api/student):');
results.studentIsolationWarnings.forEach(w => console.log(` - ${w.file} (usesRequireStudent: ${w.usesRequireStudent}, usesStudentId: ${w.usesStudentId})`));

console.log('\nParent Isolation Warnings (api/parent):');
results.parentIsolationWarnings.forEach(w => console.log(` - ${w.file} (usesRequireParent: ${w.usesRequireParent}, usesParentId: ${w.usesParentId})`));

console.log('\nPages missing dynamic export (need force-dynamic for live DB data):');
results.missingDynamicPages.forEach(w => console.log(` - ${w}`));

