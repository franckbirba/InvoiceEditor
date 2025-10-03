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
  id: 'cv-monospace-default',
  name: 'Template CV Monospace',
  typeId: 'cv',
  content: `<div class="invoice-preview" id="invoice-content">
  <!-- Header with name and title -->
  <div class="invoice-header">
    <div class="invoice-title">{{personal.name}}</div>
    {{#personal.title}}
    <div class="header-separator"></div>
    <div style="text-align: center; font-size: 14px; color: #666; margin: 8px 0;">{{personal.title}}</div>
    {{/personal.title}}
    <div class="header-separator"></div>
  </div>

  <!-- Contact info -->
  <div style="text-align: center; font-size: 12px; margin: 8px 0 16px 0;">
    {{#personal.email}}📧 {{personal.email}} | {{/personal.email}}
    {{#personal.phone}}📱 {{personal.phone}} | {{/personal.phone}}
    {{#personal.address}}📍 {{personal.address}}{{/personal.address}}
  </div>

  {{#personal.website}}
  <div style="text-align: center; font-size: 12px; margin-bottom: 16px;">
    🌐 {{personal.website}}
    {{#personal.linkedin}} | 💼 {{personal.linkedin}}{{/personal.linkedin}}
    {{#personal.github}} | 💻 {{personal.github}}{{/personal.github}}
  </div>
  {{/personal.website}}

  <!-- Summary -->
  {{#summary.summary}}
  <div class="section-title">Résumé professionnel</div>
  <div class="highlight-box">{{summary.summary}}</div>
  {{/summary.summary}}

  <!-- Experience -->
  {{#experience.experiences}}
  <div class="section-title">Expérience professionnelle</div>
  {{#.}}
  <div style="margin-bottom: 12px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <strong>{{position}}</strong>
      <span style="font-size: 12px; color: #666;">
        {{start_date}}{{#end_date}} - {{end_date}}{{/end_date}}{{#current}} - Présent{{/current}}
      </span>
    </div>
    <div style="color: #d32f2f; margin: 2px 0;">{{company}}{{#location}} • {{location}}{{/location}}</div>
    {{#description}}
    <div style="margin-top: 4px; font-size: 13px; white-space: pre-line;">{{description}}</div>
    {{/description}}
  </div>
  {{/.}}
  {{/experience.experiences}}

  <!-- Education -->
  {{#education.education}}
  <div class="section-title">Formation</div>
  {{#.}}
  <div style="margin-bottom: 12px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <strong>{{degree}}</strong>
      {{#year}}<span style="font-size: 12px; color: #666;">{{year}}</span>{{/year}}
    </div>
    <div style="color: #d32f2f; margin: 2px 0;">{{school}}{{#location}} • {{location}}{{/location}}</div>
    {{#description}}
    <div style="margin-top: 4px; font-size: 13px;">{{description}}</div>
    {{/description}}
  </div>
  {{/.}}
  {{/education.education}}

  <!-- Skills -->
  {{#skills.skills}}
  <div class="section-title">Compétences</div>
  {{#.}}
  <div style="margin-bottom: 8px;">
    <strong style="color: #6aaf50;">{{category}}:</strong>
    <span style="margin-left: 8px;">{{items}}</span>
  </div>
  {{/.}}
  {{/skills.skills}}

  <!-- Languages -->
  {{#languages.languages}}
  <div class="section-title">Langues</div>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
    {{#.}}
    <div><strong>{{language}}:</strong> {{level}}</div>
    {{/.}}
  </div>
  {{/languages.languages}}
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
