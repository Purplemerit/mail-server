const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class TemplateEngine {
  constructor() {
    this.templates = new Map();
  }

  async loadTemplate(templateName) {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName);
    }

    const templatePath = path.join(__dirname, 'html', `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiled = Handlebars.compile(templateContent);

    this.templates.set(templateName, compiled);
    return compiled;
  }

  async render(templateName, data) {
    const template = await this.loadTemplate(templateName);
    return template(data);
  }

  clearCache() {
    this.templates.clear();
  }
}

module.exports = new TemplateEngine();
