#!/usr/bin/env node

/**
 * Quick Start Script for Vivah Setu
 * Guides users through the setup process
 * Run with: node ./scripts/quickstart.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class QuickStart {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.step = 0;
    this.steps = [
      'Welcome',
      'Check Prerequisites',
      'Install Dependencies',
      'Configure Environment',
      'Start Application',
      'Verify Setup',
    ];
  }

  log(message, color = 'reset', isBold = false) {
    const prefix = isBold ? colors.bold : '';
    console.log(`${prefix}${colors[color]}${message}${colors.reset}`);
  }

  logStep(step, title) {
    console.log('');
    this.log(`Step ${step}: ${title}`, 'cyan', true);
    this.log('─'.repeat(50), 'cyan');
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(`${colors.yellow}${question}${colors.reset}`, (answer) => {
        resolve(answer.toLowerCase());
      });
    });
  }

  async run() {
    console.clear();
    this.log('╔═══════════════════════════════════════════════╗', 'cyan');
    this.log('║  🎊  Vivah Setu - Quick Start Guide  🎊       ║', 'cyan', true);
    this.log('║  Indian Wedding Planning Platform             ║', 'cyan');
    this.log('╚═══════════════════════════════════════════════╝', 'cyan');
    console.log('');

    try {
      // Step 1: Welcome
      this.logStep(1, 'Welcome');
      this.log('Welcome to Vivah Setu! 🎉', 'green', true);
      this.log('This quick start will guide you through the setup process.');
      this.log('It will take about 5-10 minutes.');
      console.log('');
      this.log('What this setup includes:', 'yellow');
      this.log('  ✅ Dependency installation');
      this.log('  ✅ Environment configuration');
      this.log('  ✅ Application startup');
      this.log('  ✅ Setup verification');
      this.log('  ✅ API health checks');
      console.log('');

      const proceed = await this.prompt('Ready to proceed? (yes/no): ');
      if (proceed !== 'yes' && proceed !== 'y') {
        this.log('\nSetup cancelled. You can run this anytime with: npm run setup', 'yellow');
        this.rl.close();
        return;
      }

      // Step 2: Check Prerequisites
      this.logStep(2, 'Check Prerequisites');
      await this.checkPrerequisites();

      // Step 3: Install Dependencies
      this.logStep(3, 'Install Dependencies');
      const skipInstall = await this.prompt(
        'Install dependencies now? (yes/no): '
      );
      if (skipInstall === 'yes' || skipInstall === 'y') {
        await this.installDependencies();
      } else {
        this.log('Remember to run: npm run install-all', 'yellow');
      }

      // Step 4: Configure Environment
      this.logStep(4, 'Configure Environment');
      await this.configureEnvironment();

      // Step 5: Start Application
      this.logStep(5, 'Start Application');
      const startApp = await this.prompt(
        'Start the application now? (yes/no): '
      );
      if (startApp === 'yes' || startApp === 'y') {
        this.log('Starting application...', 'cyan');
        console.log('');
        this.log('Frontend will run on: http://localhost:5173', 'green');
        this.log('Backend API on: http://localhost:4000', 'green');
        console.log('');
        this.log('Press Ctrl+C to stop the servers.', 'yellow');
        console.log('');
        await this.startApplication();
      }

      // Step 6: Verify Setup
      this.logStep(6, 'Verify Setup');
      if (startApp === 'yes' || startApp === 'y') {
        await this.verifySetup();
      }

      this.rl.close();
    } catch (error) {
      this.log(`\nError: ${error.message}`, 'red');
      this.rl.close();
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    this.log('Checking system requirements...', 'cyan');
    console.log('');

    // Check Node.js
    const { execSync } = require('child_process');
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      const nodeVersionNum = parseInt(nodeVersion.slice(1).split('.')[0]);

      if (nodeVersionNum >= 20) {
        this.log(`✅ Node.js ${nodeVersion} (Required: >=20.0.0)`, 'green');
      } else {
        this.log(`❌ Node.js ${nodeVersion} (Required: >=20.0.0)`, 'red');
        throw new Error('Node.js version 20+ is required');
      }
    } catch (error) {
      this.log('❌ Node.js not found', 'red');
      throw error;
    }

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
      const npmVersionNum = parseInt(npmVersion.split('.')[0]);

      if (npmVersionNum >= 10) {
        this.log(`✅ npm ${npmVersion} (Required: >=10.0.0)`, 'green');
      } else {
        this.log(`❌ npm ${npmVersion} (Required: >=10.0.0)`, 'red');
        throw new Error('npm version 10+ is required');
      }
    } catch (error) {
      this.log('❌ npm not found', 'red');
      throw error;
    }

    // Check project structure
    const requiredDirs = ['backend', 'frontend', 'tests'];
    let allDirsExist = true;
    for (const dir of requiredDirs) {
      if (fs.existsSync(path.join(__dirname, '..', dir))) {
        this.log(`✅ ${dir}/ directory found`, 'green');
      } else {
        this.log(`❌ ${dir}/ directory not found`, 'red');
        allDirsExist = false;
      }
    }

    if (!allDirsExist) {
      throw new Error('Required project directories not found');
    }

    console.log('');
    this.log('All prerequisites satisfied! ✅', 'green');
  }

  async installDependencies() {
    this.log('Installing dependencies...', 'cyan');
    this.log('(This may take 2-3 minutes)', 'yellow');
    console.log('');

    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['run', 'install-all'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });

      npm.on('close', (code) => {
        if (code === 0) {
          console.log('');
          this.log('Dependencies installed successfully! ✅', 'green');
          resolve();
        } else {
          reject(new Error('Dependency installation failed'));
        }
      });

      npm.on('error', reject);
    });
  }

  async configureEnvironment() {
    const envPath = path.join(__dirname, '..', '.env');
    const envExamplePath = path.join(__dirname, '..', '.env.example');

    if (!fs.existsSync(envPath)) {
      this.log('Creating .env file from .env.example...', 'cyan');

      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        this.log('✅ .env file created', 'green');
      } else {
        this.log('⚠️  .env.example not found', 'yellow');
      }
    } else {
      this.log('✅ .env file already exists', 'green');
    }

    console.log('');
    this.log('Environment Configuration', 'yellow', true);
    this.log('─'.repeat(50), 'yellow');
    console.log('');

    const envConfig = `VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=development
PORT=4000
JWT_SECRET=your_jwt_secret_change_in_production`;

    this.log('Key environment variables:', 'cyan');
    for (const line of envConfig.split('\n')) {
      const [key, value] = line.split('=');
      this.log(`  ${key}: ${colors.yellow}${value}${colors.reset}`, 'reset');
    }

    console.log('');
    this.log('Edit .env file to configure:', 'yellow');
    this.log('  • Supabase URL & Key');
    this.log('  • JWT Secret (production)');
    this.log('  • Email credentials (optional)');
    this.log('  • Feature flags');
  }

  async startApplication() {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });

      npm.on('close', resolve);
      npm.on('error', reject);
    });
  }

  async verifySetup() {
    this.log('Verifying application setup...', 'cyan');
    console.log('');

    const checkHealth = (port, name) => {
      return new Promise((resolve) => {
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: port,
          path: port === 4000 ? '/health' : '/',
          method: 'GET',
          timeout: 5000,
        };

        const req = http.request(options, (res) => {
          if (res.statusCode < 400) {
            this.log(`✅ ${name} is responding`, 'green');
          } else {
            this.log(`⚠️  ${name} returned ${res.statusCode}`, 'yellow');
          }
          resolve();
        });

        req.on('error', () => {
          this.log(
            `⚠️  ${name} is not responding (may still be starting)`,
            'yellow'
          );
          resolve();
        });

        req.end();
      });
    };

    await new Promise((r) => setTimeout(r, 2000));
    await checkHealth(4000, 'Backend API');
    await checkHealth(5173, 'Frontend');

    console.log('');
    this.log('Setup Complete! 🎉', 'green', true);
    console.log('');
    this.log('Next steps:', 'cyan');
    this.log('  1. Open http://localhost:5173 in your browser');
    this.log('  2. Sign up with an email address');
    this.log('  3. Create your first wedding');
    this.log('  4. Start inviting guests!');
    console.log('');
    this.log('Run tests:', 'cyan');
    this.log('  • npm test          - All tests');
    this.log('  • npm run test:qa   - QA automation');
    this.log('  • npm run test:load - Load testing');
    console.log('');
    this.log('For help:', 'cyan');
    this.log('  • Check SETUP_AND_USAGE.md for detailed documentation');
    this.log('  • Review API endpoints in IMPLEMENTATION_COMPLETE.md');
  }
}

// Run quick start
const quickstart = new QuickStart();
quickstart.run().catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
