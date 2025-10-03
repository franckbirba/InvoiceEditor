import type { DocumentType, Template, Theme } from '../document.schema';

// CV DocumentType
export const defaultCVType: DocumentType = {
  id: 'cv',
  name: 'CV',
  icon: 'User',
  description: 'Curriculum Vitae professionnel',
  sections: [
    {
      id: 'personal',
      name: 'Informations personnelles',
      fields: [
        { id: 'name', name: 'Nom complet', type: 'text', required: true },
        { id: 'title', name: 'Titre/Poste', type: 'text', required: false },
        { id: 'email', name: 'Email', type: 'email', required: false },
        { id: 'phone', name: 'Téléphone', type: 'tel', required: false },
        { id: 'address', name: 'Adresse', type: 'textarea', required: false },
        { id: 'website', name: 'Site web', type: 'url', required: false },
        { id: 'linkedin', name: 'LinkedIn', type: 'url', required: false },
        { id: 'github', name: 'GitHub', type: 'url', required: false },
      ],
    },
    {
      id: 'summary',
      name: 'Résumé professionnel',
      fields: [
        { id: 'summary', name: 'Résumé', type: 'textarea', required: false },
      ],
    },
    {
      id: 'experience',
      name: 'Expérience professionnelle',
      fields: [
        {
          id: 'experiences',
          name: 'Expériences',
          type: 'array',
          required: false,
          itemSchema: [
            { id: 'position', name: 'Poste', type: 'text', required: true },
            { id: 'company', name: 'Entreprise', type: 'text', required: true },
            { id: 'location', name: 'Lieu', type: 'text', required: false },
            { id: 'start_date', name: 'Date début', type: 'date', required: false },
            { id: 'end_date', name: 'Date fin', type: 'date', required: false },
            { id: 'current', name: 'Poste actuel', type: 'text', required: false },
            { id: 'description', name: 'Description', type: 'textarea', required: false },
          ],
        },
      ],
    },
    {
      id: 'education',
      name: 'Formation',
      fields: [
        {
          id: 'education',
          name: 'Formations',
          type: 'array',
          required: false,
          itemSchema: [
            { id: 'degree', name: 'Diplôme', type: 'text', required: true },
            { id: 'school', name: 'École', type: 'text', required: true },
            { id: 'location', name: 'Lieu', type: 'text', required: false },
            { id: 'year', name: 'Année', type: 'text', required: false },
            { id: 'description', name: 'Description', type: 'textarea', required: false },
          ],
        },
      ],
    },
    {
      id: 'skills',
      name: 'Compétences',
      fields: [
        {
          id: 'skills',
          name: 'Compétences par catégorie',
          type: 'array',
          required: false,
          itemSchema: [
            { id: 'category', name: 'Catégorie', type: 'text', required: true },
            { id: 'items', name: 'Compétences (séparées par virgules, utilisez * pour importance)', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      id: 'languages',
      name: 'Langues',
      fields: [
        {
          id: 'languages',
          name: 'Langues',
          type: 'array',
          required: false,
          itemSchema: [
            { id: 'language', name: 'Langue', type: 'text', required: true },
            { id: 'level', name: 'Niveau', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Default CV template
export const defaultCVTemplate: Template = {
  id: 'cv-terminal-default',
  name: 'Template CV Terminal',
  typeId: 'cv',
  content: `<div class="cv-preview" id="cv-content">
  <!-- Header with double line separator -->
  <div class="cv-header">
    <div class="double-separator"></div>
    <h1 class="cv-title"><span data-field="header.name">{{header.name}}</span></h1>
    <div class="cv-subtitle"><span data-field="header.title">{{header.title}}</span></div>
    <div class="double-separator"></div>
  </div>

  <!-- Identity Section -->
  {{#identity.summary}}
  <div class="cv-section">
    <div class="section-title">~/cv/identity: <span class="command">whoami</span></div>
    <div class="content-box">
      <div class="section-content"><span data-field="identity.summary">{{identity.summary}}</span></div>
    </div>
  </div>
  {{/identity.summary}}

  <!-- Contact Section -->
  <div class="cv-section">
    <div class="section-title">~/cv/contact: <span class="command">cat contact.txt</span></div>
    <div class="content-box">
      {{#contact.email}}
      <div class="contact-line">📧 <span data-field="contact.email">{{contact.email}}</span></div>
      {{/contact.email}}
      {{#contact.phone}}
      <div class="contact-line">📱 <span data-field="contact.phone">{{contact.phone}}</span></div>
      {{/contact.phone}}
      {{#contact.location}}
      <div class="contact-line">📍 <span data-field="contact.location">{{contact.location}}</span></div>
      {{/contact.location}}
    </div>
  </div>

  <!-- Experience Section -->
  <div class="cv-section">
    <div class="section-title">~/cv/experience: <span class="command">cat experience.txt</span></div>
    <div class="content-box">
      {{#experiences}}
      <div class="experience-item" data-item-index="{{index}}">
        <div class="experience-header">
          <span class="experience-period">[<span data-field="experiences.{{index}}.period">{{period}}</span>]</span> <span class="arrow">▶</span> <strong><span data-field="experiences.{{index}}.company">{{company}}</span></strong> – <span data-field="experiences.{{index}}.position">{{position}}</span>
        </div>
        {{#description}}
        <div class="experience-description"><span data-field="experiences.{{index}}.description">{{description}}</span></div>
        {{/description}}
        {{#achievements}}
        <div class="experience-achievements"><span data-field="experiences.{{index}}.achievements">{{{achievements}}}</span></div>
        {{/achievements}}
      </div>
      {{/experiences}}
    </div>
  </div>

  <!-- Skills Section -->
  <div class="cv-section">
    <div class="section-title">~/cv/skills: <span class="command">cat tech-skills.txt</span></div>
    <div class="content-box skills-section" data-array-container="skills">
      {{#skills}}
      <div class="skill-category" data-item-index="{{index}}">
        <strong><span data-field="skills.{{index}}.category">{{category}}</span>:</strong> <span class="skill-items" data-field="skills.{{index}}.items">{{items}}</span>
      </div>
      {{/skills}}
    </div>
  </div>

  <!-- Education Section -->
  <div class="cv-section">
    <div class="section-title">~/cv/formation: <span class="command">tree</span></div>
    <div class="content-box">
      <div class="education-tree">
        .
        {{#education}}
        <div class="education-item" data-item-index="{{index}}">
          <span class="tree-branch">├──</span> <strong><span data-field="education.{{index}}.degree">{{degree}}</span></strong> <span data-field="education.{{index}}.institution">{{institution}}</span> <span class="education-year"><span data-field="education.{{index}}.year">{{year}}</span></span>
        </div>
        {{/education}}
      </div>
    </div>
  </div>

  <!-- Languages Section -->
  <div class="cv-section">
    <div class="section-title">~/cv/langues: <span class="command">cat langues.txt</span></div>
    <div class="content-box">
      {{#languages}}
      <div class="language-item" data-item-index="{{index}}">
        🌐 <strong><span data-field="languages.{{index}}.name">{{name}}</span></strong> : <span data-field="languages.{{index}}.level">{{level}}</span>
      </div>
      {{/languages}}
    </div>
  </div>

  <!-- Footer Section -->
  <div class="cv-section">
    <div class="section-title">~/cv: <span class="command">cat signature.txt</span></div>
    <div class="content-box">
      <div class="footer-content">
        {{#footer.website}}
        <span data-field="footer.website">{{footer.website}}</span>
        {{/footer.website}}
        {{#footer.github}}
        <br><span data-field="footer.github">{{footer.github}}</span>
        {{/footer.github}}
      </div>
    </div>
  </div>
</div>`,
  isDefault: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// CV uses the terminal theme
export const defaultCVTheme: Theme = {
  id: 'theme-cv-default',
  name: 'Thème CV Terminal',
  content: `:root {
  /* Colors matching the Facture theme */
  --color-bg: #ffffff;
  --color-fg: #333333;
  --color-box-bg: #f0f0f0;
  --color-green: #6aaf50;
  --color-red: #d32f2f;
  --color-blue: #2980b9;
  --color-orange: #e67e22;
  --color-border: #333333;

  /* Typography - Monospace */
  --font-mono: 'Courier New', monospace;
  --h1: 18pt;
  --h2: 11pt;
  --text: 10pt;

  /* Layout */
  --page-w: 794px;
  --page-pad: 40px;
  --gap: 15px;
}

/* CV Preview Container */
.cv-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: white;
  color: var(--color-fg);
  font-family: var(--font-mono);
  font-size: var(--text);
  line-height: 1.5;
}

/* Header */
.cv-header {
  text-align: center;
  margin-bottom: 30px;
}

.double-separator {
  border-top: 3px double var(--color-green);
  margin: 10px 0;
}

.cv-title {
  font-size: var(--h1);
  font-weight: bold;
  margin: 15px 0 5px 0;
  color: var(--color-fg);
  letter-spacing: 1px;
}

.cv-subtitle {
  font-size: var(--h2);
  color: var(--color-fg);
  margin: 5px 0 15px 0;
  letter-spacing: 0.5px;
}

/* Sections */
.cv-section {
  margin-bottom: 20px;
  page-break-inside: avoid;
}

.section-title {
  font-size: var(--text);
  font-weight: bold;
  margin-bottom: 8px;
}

/* Prompt part in green */
.section-title {
  color: var(--color-green);
}

/* Command part in gray */
span.command {
  color: #666666 !important;
  font-weight: normal !important;
}

.section-title span.command {
  color: #666666 !important;
  font-weight: normal !important;
}

.content-box {
  background-color: var(--color-box-bg);
  padding: 15px;
  margin-bottom: 5px;
}

.section-content {
  white-space: pre-line;
  line-height: 1.6;
}

/* Contact */
.contact-line {
  margin-bottom: 2px;
  line-height: 1.4;
}

/* Experience */
.experience-item {
  margin-bottom: 15px;
}

.experience-item:last-child {
  margin-bottom: 0;
}

.experience-header {
  margin-bottom: 5px;
  line-height: 1.4;
}

.experience-period {
  color: var(--color-red);
  font-weight: bold;
}

.arrow {
  color: var(--color-fg);
}

.experience-description {
  margin-top: 5px;
  margin-left: 0;
  white-space: pre-line;
  line-height: 1.5;
}

.experience-achievements {
  margin-top: 5px;
  margin-left: 0;
  white-space: pre-line;
  line-height: 1.5;
}

/* Skills */
.skill-category {
  margin-bottom: 8px;
  line-height: 1.6;
}

.skill-items {
  font-weight: normal;
}

.skill-item {
  display: inline;
}

/* Education */
.education-tree {
  margin-left: 0;
  line-height: 1.6;
}

.education-item {
  margin-bottom: 3px;
}

.tree-branch {
  color: var(--color-fg);
  margin-right: 5px;
}

.education-year {
  color: var(--color-red);
  font-weight: bold;
}

/* Languages */
.language-item {
  margin-bottom: 5px;
  line-height: 1.5;
}

/* Footer */
.footer-content {
  text-align: center;
  line-height: 1.6;
}

.footer-content a {
  color: var(--color-blue);
  text-decoration: underline;
}

/* Print styles */
@media print {
  .cv-preview {
    padding: 20px;
    max-width: 100%;
  }

  .content-box {
    break-inside: avoid;
  }
}

@page {
  margin: 15mm;
  size: A4;
}`,
  isDefault: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
