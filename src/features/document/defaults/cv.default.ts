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
          name: 'Compétences',
          type: 'array',
          required: false,
          itemSchema: [
            { id: 'category', name: 'Catégorie', type: 'text', required: true },
            { id: 'items', name: 'Compétences', type: 'textarea', required: true },
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
  <!-- Header -->
  <div class="cv-header">
    {{#header.prompt}}
    <div class="prompt">{{header.prompt}}</div>
    {{/header.prompt}}
    <hr class="header-separator">
    <h1 class="cv-title">{{header.name}}</h1>
    <div class="cv-subtitle">{{header.title}}</div>
    <hr class="header-separator">
  </div>

  <!-- Identity Section -->
  {{#identity.summary}}
  <div class="cv-section">
    <div class="section-title">~/cv/identity: whoami</div>
    <div class="terminal-box">
      <div class="prompt">{{header.prompt}}</div>
      <div class="section-content">{{identity.summary}}</div>
    </div>
  </div>
  {{/identity.summary}}

  <!-- Contact Section -->
  <div class="cv-section">
    <div class="section-title">~/cv/contact: cat contact.txt</div>
    <div class="terminal-box">
      <div class="prompt">{{header.prompt}}</div>
      {{#contact.email}}
      <div class="contact-line">📧 {{contact.email}}</div>
      {{/contact.email}}
      {{#contact.phone}}
      <div class="contact-line">📱 {{contact.phone}}</div>
      {{/contact.phone}}
      {{#contact.location}}
      <div class="contact-line">📍 {{contact.location}}</div>
      {{/contact.location}}
    </div>
  </div>

  <!-- Experience Section -->
  {{#experiences}}
  <div class="cv-section">
    <div class="section-title">~/cv/experience: cat experience.txt</div>
    <div class="terminal-box">
      <div class="prompt">{{header.prompt}}</div>
      {{#.}}
      <div class="experience-item">
        <div class="experience-header">
          <span class="experience-period">[{{period}}]</span> ▶
          <span class="experience-company">{{company}}</span> –
          <span>{{position}}</span>
        </div>
        {{#description}}
        <div class="experience-description">{{description}}</div>
        {{/description}}
        {{#achievements}}
        <div class="experience-achievements">{{{achievements}}}</div>
        {{/achievements}}
      </div>
      <hr class="separator">
      {{/.}}
    </div>
  </div>
  {{/experiences}}

  <!-- Skills Section -->
  {{#skills.technical}}
  <div class="cv-section">
    <div class="section-title">~/cv/skills: cat tech-skills.txt</div>
    <div class="terminal-box">
      <div class="prompt">{{header.prompt}}</div>
      <div class="skills-grid">
        {{{skills.technical}}}
      </div>
    </div>
  </div>
  {{/skills.technical}}

  <!-- Education Section -->
  {{#education}}
  <div class="cv-section">
    <div class="section-title">~/cv/formation: tree</div>
    <div class="terminal-box">
      <div class="prompt">{{header.prompt}}</div>
      <div class="education-tree">
        .
        {{#.}}
        <div class="education-item">
          <span class="tree-branch">├──</span>
          <strong>{{degree}}</strong> {{institution}}
          <span class="education-year">{{year}}</span>
        </div>
        {{/.}}
      </div>
    </div>
  </div>
  {{/education}}

  <!-- Languages Section -->
  {{#languages}}
  <div class="cv-section">
    <div class="section-title">~/cv/langues: cat langues.txt</div>
    <div class="terminal-box">
      <div class="prompt">{{header.prompt}}</div>
      {{#.}}
      <div class="language-item">
        <span class="flag">🌐</span>
        <strong>{{name}}</strong> : {{level}}
      </div>
      {{/.}}
    </div>
  </div>
  {{/languages}}

  <!-- Footer Section -->
  {{#footer.website}}
  <div class="cv-section cv-footer">
    <div class="section-title">~/cv: cat signature.txt</div>
    <div class="terminal-box">
      <div class="prompt">{{header.prompt}}</div>
      <a href="{{footer.website}}" target="_blank">{{footer.website}}</a>
      {{#footer.github}}
      <br><a href="{{footer.github}}" target="_blank">{{footer.github}}</a>
      {{/footer.github}}
    </div>
  </div>
  {{/footer.website}}
</div>`,
  isDefault: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// CV uses the same theme as invoices (CV monospace theme)
export const defaultCVTheme: Theme = {
  id: 'theme-cv-default',
  name: 'Thème CV Monospace',
  content: '', // Will use existing theme-cv.css
  isDefault: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
