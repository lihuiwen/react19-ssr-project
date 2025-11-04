import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs-extra'
import { execSync } from 'child_process'
import { logger } from '../utils/logger'
import { CLIError } from '../utils/error'

interface CreateOptions {
  template?: string
  install?: boolean
  git?: boolean
}

/**
 * Create command - scaffold a new React 19 SSR project
 */
export async function createCommand(projectName: string, options: CreateOptions) {
  try {
    logger.banner('✨ Creating new React 19 SSR project')
    logger.newline()

    // Validate project name
    if (!projectName || projectName.trim() === '') {
      throw new CLIError(
        'Project name is required',
        'INVALID_PROJECT_NAME',
        'Usage: react19-ssr create <project-name>'
      )
    }

    // Check if directory already exists
    const targetDir = path.resolve(process.cwd(), projectName)
    if (fs.existsSync(targetDir)) {
      throw new CLIError(
        `Directory "${projectName}" already exists`,
        'DIRECTORY_EXISTS',
        `Try:
  • Remove the directory: rm -rf ${projectName}
  • Use a different project name`
      )
    }

    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Select a package manager:',
        default: 'pnpm',
        choices: [
          { name: 'pnpm (recommended)', value: 'pnpm' },
          { name: 'npm', value: 'npm' },
          { name: 'yarn', value: 'yarn' },
        ],
      },
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies now?',
        default: options.install !== false,
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialize git repository?',
        default: options.git !== false,
      },
    ])

    // Step 1: Copy template
    const spinner = logger.startSpinner('Creating project structure...')
    const templateDir = path.resolve(__dirname, '../../../templates/basic')

    if (!fs.existsSync(templateDir)) {
      logger.failSpinner('Template not found')
      throw new CLIError(
        'Template directory not found',
        'TEMPLATE_NOT_FOUND',
        'Available template: basic'
      )
    }

    await fs.copy(templateDir, targetDir)
    logger.succeedSpinner('Project structure created')

    // Step 2: Update package.json
    const packageJsonPath = path.join(targetDir, 'package.json')
    const packageJson = await fs.readJSON(packageJsonPath)
    packageJson.name = projectName
    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 })
    logger.success('Updated package.json')

    // Step 3: Install dependencies
    if (answers.installDeps) {
      logger.newline()
      logger.info('Installing dependencies...')
      logger.info(`This might take a few minutes...`)
      logger.newline()

      try {
        const installCmd = {
          pnpm: 'pnpm install',
          npm: 'npm install',
          yarn: 'yarn install',
        }[answers.packageManager as 'pnpm' | 'npm' | 'yarn']

        execSync(installCmd, {
          cwd: targetDir,
          stdio: 'inherit',
        })

        logger.newline()
        logger.success('Dependencies installed successfully')
      } catch (error) {
        logger.warn('Dependency installation failed')
        logger.info('You can install them manually later')
      }
    }

    // Step 4: Initialize Git
    if (answers.initGit) {
      const gitSpinner = logger.startSpinner('Initializing git repository...')

      try {
        execSync('git init', { cwd: targetDir, stdio: 'pipe' })
        execSync('git add .', { cwd: targetDir, stdio: 'pipe' })
        execSync('git commit -m "Initial commit from React 19 SSR Framework"', {
          cwd: targetDir,
          stdio: 'pipe',
        })
        logger.succeedSpinner('Git repository initialized')
      } catch (error) {
        logger.warnSpinner('Git initialization failed (optional)')
      }
    }

    // Success message
    logger.newline()
    logger.divider()
    logger.success(`Project "${projectName}" created successfully!`)
    logger.newline()

    // Next steps
    logger.info('📋 Next steps:')
    console.log()
    console.log(`  cd ${projectName}`)
    if (!answers.installDeps) {
      console.log(`  ${answers.packageManager} install`)
    }
    console.log(`  ${answers.packageManager} dev`)
    console.log()
    logger.divider()
    logger.newline()

    logger.info('Happy coding! 🚀')
  } catch (error) {
    throw error
  }
}
