const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function run(cmd, args, cwd) {
  return new Promise(resolve => {
    const proc = spawn(cmd, args, { cwd });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', status => resolve({ status, stdout, stderr }));
  });
}

async function testSingleFileJava() {
  const tmpDir = path.join(os.tmpdir(), 'test_java_single');
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'Main.java'), 'public class Main { public static void main(String[] args){ System.out.println("OK"); } }');

  console.time('Single-file java Main.java');
  const res = await run('java', ['-Xmx128m', '-XX:+TieredCompilation', '-XX:TieredStopAtLevel=1', 'Main.java'], tmpDir);
  console.timeEnd('Single-file java Main.java');
  console.log('Result:', res);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

testSingleFileJava();
