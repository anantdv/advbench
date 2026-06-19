import { loadConfig, erpnextJson } from './erpnext-bridge.mjs';

const sprintDoctypeName = 'AdvBench Sprint';
const sprintDoctype = {
  name: sprintDoctypeName,
  module: 'Projects',
  custom: 1,
  istable: 0,
  issingle: 0,
  track_changes: 1,
  allow_rename: 1,
  allow_import: 1,
  show_name_in_global_search: 1,
  quick_entry: 1,
  document_type: 'Setup',
  title_field: 'sprint_name',
  autoname: 'naming_series:',
  search_fields: 'sprint_name,project,status',
  fields: [
    {
      fieldname: 'naming_series',
      label: 'Series',
      fieldtype: 'Select',
      options: 'SPR-.####',
      reqd: 1,
      set_only_once: 1,
      in_list_view: 0,
    },
    {
      fieldname: 'sprint_name',
      label: 'Sprint Name',
      fieldtype: 'Data',
      reqd: 1,
      unique: 1,
      in_list_view: 1,
    },
    {
      fieldname: 'project',
      label: 'Project',
      fieldtype: 'Link',
      options: 'Project',
      reqd: 1,
      in_list_view: 1,
    },
    {
      fieldname: 'status',
      label: 'Status',
      fieldtype: 'Select',
      options: 'Planning\nActive\nCompleted\nCancelled',
      default: 'Planning',
      in_standard_filter: 1,
      in_list_view: 1,
    },
    {
      fieldname: 'start_date',
      label: 'Start Date',
      fieldtype: 'Date',
      reqd: 1,
      in_list_view: 1,
    },
    {
      fieldname: 'end_date',
      label: 'End Date',
      fieldtype: 'Date',
      in_list_view: 1,
    },
    {
      fieldname: 'goal',
      label: 'Goal',
      fieldtype: 'Small Text',
    },
    {
      fieldname: 'planned_points',
      label: 'Planned Points',
      fieldtype: 'Int',
      in_list_view: 1,
    },
    {
      fieldname: 'completed_points',
      label: 'Completed Points',
      fieldtype: 'Int',
      in_list_view: 1,
    },
    {
      fieldname: 'velocity',
      label: 'Velocity',
      fieldtype: 'Float',
      in_list_view: 1,
    },
    {
      fieldname: 'remarks',
      label: 'Remarks',
      fieldtype: 'Text Editor',
    },
  ],
  permissions: [
    {
      role: 'System Manager',
      read: 1,
      write: 1,
      create: 1,
      delete: 1,
      report: 1,
      export: 1,
      share: 1,
      print: 1,
      email: 1,
    },
    {
      role: 'Delivery Manager',
      read: 1,
      write: 1,
      create: 1,
      delete: 1,
      report: 1,
      export: 1,
      share: 1,
      print: 1,
      email: 1,
    },
    {
      role: 'Delivery User',
      read: 1,
      write: 1,
      create: 1,
      delete: 0,
      report: 1,
      export: 0,
      share: 0,
      print: 0,
      email: 0,
    },
  ],
};

const taskSprintField = {
  dt: 'Task',
  fieldname: 'custom_advbench_sprint',
  label: 'Sprint',
  fieldtype: 'Link',
  options: sprintDoctypeName,
  insert_after: 'project',
  in_list_view: 1,
};

async function docTypeExists(config, name) {
  const query = `/api/resource/DocType?limit_page_length=1&fields=["name"]&filters=[["name","=","${name}"]]`;
  const response = await erpnextJson(config, query);
  return Array.isArray(response.data) && response.data.length > 0;
}

async function ensureDocType(config, docType) {
  const exists = await docTypeExists(config, docType.name);
  if (exists) {
    console.log(`DocType already exists: ${docType.name}`);
    return;
  }

  await erpnextJson(config, '/api/resource/DocType', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(docType),
  });

  console.log(`Created DocType: ${docType.name}`);
}

async function fieldExists(config, fieldname, dt) {
  const query = `/api/resource/Custom%20Field?limit_page_length=1&fields=["name","fieldname","dt"]&filters=[["dt","=","${dt}"],["fieldname","=","${fieldname}"]]`;
  const response = await erpnextJson(config, query);
  return Array.isArray(response.data) && response.data.length > 0;
}

async function ensureField(config, field) {
  const exists = await fieldExists(config, field.fieldname, field.dt);
  if (exists) {
    console.log(`Custom Field already exists: ${field.dt}.${field.fieldname}`);
    return;
  }

  await erpnextJson(config, '/api/resource/Custom%20Field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...field,
      in_list_view: 1,
      allow_on_submit: 0,
    }),
  });

  console.log(`Created Custom Field: ${field.dt}.${field.fieldname}`);
}

async function main() {
  const config = loadConfig();
  await ensureDocType(config, sprintDoctype);
  await ensureField(config, taskSprintField);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
