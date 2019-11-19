const { prompt } = require('inquirer')
const program = require('commander')
const chalk = require('chalk')
const download = require('download-git-repo')
const ora = require('ora')
const fs = require('fs')

const option = program.parse(process.argv).args[0]
const defaultName = typeof option === 'string' ? option : 'vue-project'
const tplList = require('../template.json')
const tplLists = Object.keys(tplList) || [];

const uiList = require('../ui.json');
const uiLists = Object.keys(uiList) || [];


const question = [
  {
    type: 'input',
    name: 'name',
    message: 'Project name',
    default: defaultName,
    filter(val) {
      return val.trim()
    },
    validate(val) {
      const validate = (val.trim().split(" ")).length === 1
      return validate || 'Project name is not allowed to have spaces ';
    },
    transformer(val) {
      return val;
    }
  },
  {
    type: 'list',
    name: 'ui',
    message: 'UI Starter Kit',
    choices: uiLists,
    default: uiLists[0],
    validate(val) {
      return true;
    },
    transformer(val) {
      return val;
    }
  },
  {
    type: 'list',
    name: 'template',
    message: 'Project template',
    choices: tplLists,
    default: tplLists[0],
    validate(val) {
      return true;
    },
    transformer(val) {
      return val;
    }
  },
  {
    type: 'input',
    name: 'description',
    message: 'Project description',
    default: 'vue project',
    validate(val) {
      return true;
    },
    transformer(val) {
      return val;
    }
  },
  {
    type: 'input',
    name: 'author',
    message: 'Author',
    default: 'project author',
    validate(val) {
      return true;
    },
    transformer(val) {
      return val;
    }
  }
]

function insertCode (path,pos,content) {
  let insert = fs.readFileSync(path, 'utf8').split('\n');

  insert.splice(pos, 0, content);

  fs.writeFileSync(path, insert.join('\n'), 'utf8')
}

module.exports = prompt(question).then(({ name, template, ui, description, author }) => {
  console.log(ui);
  const projectName = name;
  const templateName = template;
  const uiName = ui;
  const gitPlace = tplList[templateName]['place'];
  const gitBranch = tplList[templateName]['branch'];
  const spinner = ora('Downloading please wait...');
  spinner.start();

  download(`${gitPlace}${gitBranch}`, `./${projectName}`, (err) => {
    if (err) {
      console.log(chalk.red(err))
      process.exit()
    }
    fs.readFile(`./${projectName}/package.json`, 'utf8', function (err, data) {
      if (err) {
        spinner.stop();
        console.error(err);
        return;
      }
      const packageJson = JSON.parse(data);
      packageJson.name = name;
      packageJson.description = description;
      packageJson.author = author;
      uiName === 'none' ? '':packageJson['dependencies'][`${uiName}`] = `${uiList[uiName]['version']}`
      var updatePackageJson = JSON.stringify(packageJson, null, 2);
      fs.writeFile(`./${projectName}/package.json`, updatePackageJson, 'utf8', function (err) {
        if (err) {
          spinner.stop();
          console.error(err);
          return;
        } else {
          if (uiName === 'view-design') {
            let content = `import ViewUI from 'view-design';\nimport 'view-design/dist/styles/iview.css';\nVue.use(ViewUI);`
            insertCode(`./${projectName}/src/main.js`,5,content)
          }else if (uiName === 'element-ui') {
            let content = `import ElementUI from 'element-ui';\nimport 'element-ui/lib/theme-chalk/index.css';\nVue.use(ElementUI);`
            insertCode(`./${projectName}/src/main.js`,5,content)
          }else{
            console.log('no ui');
          }
          spinner.stop();
          console.log(chalk.green('project init successfully!'))
          console.log(`
            ${chalk.yellow(`cd ${name}`)}
            ${chalk.yellow('yarn')}
            ${chalk.yellow('yarn serve')}
          `);
        }
      });
    });
  })
})
