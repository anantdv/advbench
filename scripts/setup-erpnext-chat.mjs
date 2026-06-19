import { erpnextJson, loadConfig } from './erpnext-bridge.mjs';

const commonPermissions = [
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
    delete: 1,
    report: 1,
    export: 0,
    share: 0,
    print: 0,
    email: 0,
  },
];

const chatRoomDoctype = {
  name: 'Chat Room',
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
  title_field: 'title',
  autoname: 'field:room_key',
  search_fields: 'title,project,room_type,last_message_preview',
  fields: [
    { fieldname: 'room_key', label: 'Room Key', fieldtype: 'Data', reqd: 1, unique: 1, hidden: 1, read_only: 1 },
    {
      fieldname: 'room_type',
      label: 'Room Type',
      fieldtype: 'Select',
      options: 'direct\nproject_group',
      default: 'direct',
      reqd: 1,
      in_list_view: 1,
    },
    { fieldname: 'title', label: 'Title', fieldtype: 'Data', reqd: 1, in_list_view: 1 },
    { fieldname: 'project', label: 'Project', fieldtype: 'Link', options: 'Project', in_list_view: 1 },
    { fieldname: 'project_title', label: 'Project Title', fieldtype: 'Data' },
    { fieldname: 'created_by', label: 'Created By', fieldtype: 'Link', options: 'User' },
    { fieldname: 'last_message_at', label: 'Last Message At', fieldtype: 'Datetime', in_list_view: 1 },
    { fieldname: 'last_message_preview', label: 'Last Message', fieldtype: 'Small Text' },
    { fieldname: 'last_sender', label: 'Last Sender', fieldtype: 'Link', options: 'User' },
    { fieldname: 'member_count', label: 'Member Count', fieldtype: 'Int', in_list_view: 1 },
  ],
  permissions: commonPermissions,
};

const chatRoomMemberDoctype = {
  name: 'Chat Room Member',
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
  title_field: 'full_name',
  autoname: 'field:member_key',
  search_fields: 'room,user,full_name',
  fields: [
    { fieldname: 'member_key', label: 'Member Key', fieldtype: 'Data', reqd: 1, unique: 1, hidden: 1, read_only: 1 },
    { fieldname: 'room', label: 'Room', fieldtype: 'Link', options: 'Chat Room', reqd: 1, in_list_view: 1 },
    { fieldname: 'user', label: 'User', fieldtype: 'Link', options: 'User', reqd: 1, in_list_view: 1 },
    { fieldname: 'full_name', label: 'Full Name', fieldtype: 'Data', in_list_view: 1 },
    {
      fieldname: 'role',
      label: 'Role',
      fieldtype: 'Select',
      options: 'owner\nmember',
      default: 'member',
      in_list_view: 1,
    },
    { fieldname: 'unread_count', label: 'Unread Count', fieldtype: 'Int', default: 0, in_list_view: 1 },
    { fieldname: 'last_read_at', label: 'Last Read At', fieldtype: 'Datetime', in_list_view: 1 },
    { fieldname: 'muted', label: 'Muted', fieldtype: 'Check', default: 0, in_list_view: 1 },
  ],
  permissions: commonPermissions,
};

const chatMessageDoctype = {
  name: 'Chat Message',
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
  title_field: 'content',
  autoname: 'field:message_key',
  search_fields: 'room,sender,content',
  fields: [
    { fieldname: 'message_key', label: 'Message Key', fieldtype: 'Data', reqd: 1, unique: 1, hidden: 1, read_only: 1 },
    { fieldname: 'room', label: 'Room', fieldtype: 'Link', options: 'Chat Room', reqd: 1, in_list_view: 1 },
    { fieldname: 'sender', label: 'Sender', fieldtype: 'Link', options: 'User', reqd: 1, in_list_view: 1 },
    { fieldname: 'sender_name', label: 'Sender Name', fieldtype: 'Data', in_list_view: 1 },
    { fieldname: 'content', label: 'Content', fieldtype: 'Small Text', reqd: 1, in_list_view: 1 },
    {
      fieldname: 'message_type',
      label: 'Message Type',
      fieldtype: 'Select',
      options: 'text\nsystem',
      default: 'text',
      in_list_view: 1,
    },
    { fieldname: 'client_message_id', label: 'Client Message ID', fieldtype: 'Data', unique: 1, hidden: 1 },
  ],
  permissions: commonPermissions,
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

async function main() {
  const config = loadConfig();
  await ensureDocType(config, chatRoomDoctype);
  await ensureDocType(config, chatRoomMemberDoctype);
  await ensureDocType(config, chatMessageDoctype);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
