module.exports = function (it) {
  const { directoryPath } = it

  return `
ESLint couldn't find a configuration file. To set up a configuration file for this project, please run:

    eslint --init

ESLint looked for configuration files in ${directoryPath} and its ancestors. If it found none, it then looked in your home directory.

If you think you already have a configuration file or if you need more help, please stop by the ESLint chat room: https://eslint.org/chat/help
`.trimStart()
}
