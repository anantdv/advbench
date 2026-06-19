import { loadConfig, erpnextJson } from './erpnext-bridge.mjs';

const fields = [
  {
    dt: 'Project',
    fieldname: 'custom_advbench_project_manager',
    label: 'Project Manager',
    fieldtype: 'Link',
    options: 'User',
    insert_after: 'customer',
  },
  {
    dt: 'Project',
    fieldname: 'custom_advbench_start_date',
    label: 'Start Date',
    fieldtype: 'Date',
    insert_after: 'custom_advbench_project_manager',
  },
  {
    dt: 'Project',
    fieldname: 'custom_advbench_end_date',
    label: 'End Date',
    fieldtype: 'Date',
    insert_after: 'custom_advbench_start_date',
  },
  {
    dt: 'Project',
    fieldname: 'custom_advbench_budget',
    label: 'Budget',
    fieldtype: 'Currency',
    insert_after: 'custom_advbench_end_date',
  },
  {
    dt: 'Task',
    fieldname: 'custom_advbench_assignee',
    label: 'Assignee',
    fieldtype: 'Link',
    options: 'User',
    insert_after: 'priority',
  },
  {
    dt: 'Task',
    fieldname: 'custom_advbench_due_date',
    label: 'Due Date',
    fieldtype: 'Date',
    insert_after: 'custom_advbench_assignee',
  },
  {
    dt: 'Task',
    fieldname: 'custom_advbench_story_points',
    label: 'Story Points',
    fieldtype: 'Int',
    insert_after: 'custom_advbench_due_date',
  },
];

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

  const payload = {
    ...field,
    in_list_view: 1,
    allow_on_submit: 0,
  };

  await erpnextJson(config, '/api/resource/Custom%20Field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log(`Created Custom Field: ${field.dt}.${field.fieldname}`);
}

async function main() {
  const config = loadConfig();
  for (const field of fields) {
    await ensureField(config, field);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
