import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { SectionFrame } from '../components/dashboard/SectionFrame';
import { DetailDrawer } from '../components/DetailDrawer';
import { fetchProjects, fetchSprints, fetchTasks } from '../lib/erpnext';
import {
  activity,
  adminUsers,
  integrationStatus,
  projectMilestones,
  projectRisks,
  reportCards,
  sprints as sprintBlueprints,
  team,
  timeEntries,
} from '../data';
import type { Project, SectionKey, Sprint, Task } from '../types';
import { useUiStore } from '../store/uiStore';

const copy: Record<SectionKey, { title: string; description: string }> = {
  dashboard: {
    title: 'Executive Dashboard',
    description: 'A concise view of delivery health, workload, and what needs attention next.',
  },
  projects: {
    title: 'Projects',
    description: 'Track active engagements, milestones, risks, and deliverables in one place.',
  },
  tasks: {
    title: 'Tasks',
    description: 'Manage work across backlog, board, list, calendar, and timeline views.',
  },
  collaboration: {
    title: 'Collaboration',
    description: 'Track team activity, announcements, and delivery pulse in one view.',
  },
  sprints: {
    title: 'Sprints',
    description: 'Track sprint planning, velocity, and delivery progress from the workspace snapshot.',
  },
  resources: {
    title: 'Resources',
    description: 'Review capacity, utilization, and team skills across the delivery bench.',
  },
  'time-tracking': {
    title: 'Time Tracking',
    description: 'Review recent time entries, billable effort, and where hours are going.',
  },
  clients: {
    title: 'Clients',
    description: 'Review client health, open risks, and active engagements.',
  },
  reports: {
    title: 'Reports',
    description: 'See the workspace scorecards that leadership can review at a glance.',
  },
  administration: {
    title: 'Administration',
    description: 'Manage users, roles, settings, and integrations safely.',
  },
};

const projectStatuses = ['All', 'Open', 'Completed', 'Cancelled'] as const;
const sprintStatuses = ['All', 'Planning', 'Active', 'Completed', 'Cancelled'] as const;
const taskStatuses = ['All', 'Backlog', 'Open', 'Working', 'Completed'] as const;
const taskSorts = ['Due Date', 'Priority', 'Assignee'] as const;
const pageSize = 20;

type DrawerState =
  | { kind: 'project'; mode: 'view' | 'create' | 'edit'; item?: Project }
  | { kind: 'sprint'; mode: 'view' | 'create' | 'edit'; item?: Sprint }
  | { kind: 'task'; mode: 'view' | 'create' | 'edit'; item?: Task }
  | null;

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <SectionFrame kicker="ERPNext" title={title}>
      <p className="empty-copy">{description}</p>
    </SectionFrame>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalCount,
  start,
  end,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  start: number;
  end: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {start}-{end} of {totalCount}
      </span>
      <div className="pagination-actions">
        <button type="button" className="secondary-btn" onClick={onPrev} disabled={page <= 1}>
          Previous
        </button>
        <span className="pagination-page">
          Page {page} of {totalPages}
        </span>
        <button type="button" className="secondary-btn" onClick={onNext} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}

function LinkField({
  label,
  name,
  defaultValue,
  options,
  placeholder,
  doctype,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
  placeholder?: string;
  doctype: string;
  required?: boolean;
}) {
  const listId = `${name}-options`;

  return (
    <label>
      <span>
        {label} <small className="link-hint">({doctype})</small>
      </span>
      <input name={name} list={listId} defaultValue={defaultValue} placeholder={placeholder} required={required} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

export function ModulePage() {
  const activeSection = useUiStore((state) => state.activeSection);
  const searchQuery = useUiStore((state) => state.searchQuery);
  const [searchParams, setSearchParams] = useSearchParams();
  const title = copy[activeSection].title;
  const description = copy[activeSection].description;

  const { data: projectData = [] } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
  const { data: sprintData = [] } = useQuery({ queryKey: ['sprints'], queryFn: fetchSprints });
  const { data: taskData = [] } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks });

  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [projectFilter, setProjectFilter] = useState<(typeof projectStatuses)[number]>('All');
  const [sprintFilter, setSprintFilter] = useState<(typeof sprintStatuses)[number]>('All');
  const [taskFilter, setTaskFilter] = useState<(typeof taskStatuses)[number]>('All');
  const [taskSort, setTaskSort] = useState<(typeof taskSorts)[number]>('Due Date');
  const [projectPage, setProjectPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [sprintPage, setSprintPage] = useState(1);
  const [collaborationPage, setCollaborationPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [timePage, setTimePage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);

  const filteredProjects = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return projectData.filter((project) => {
      const matchesStatus = projectFilter === 'All' || project.status === projectFilter;
      const matchesQuery =
        !term ||
        [project.code, project.name, project.client, project.manager, project.status, project.priority]
          .join(' ')
          .toLowerCase()
          .includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [projectData, projectFilter, searchQuery]);

  const projectTotalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = filteredProjects.slice((projectPage - 1) * pageSize, projectPage * pageSize);

  const filteredTasks = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const priorityRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return [...taskData]
      .filter((task) => {
        const matchesStatus = taskFilter === 'All' || task.status === taskFilter;
        const matchesQuery =
          !term ||
          [task.id, task.title, task.project, task.assignee, task.status, task.priority].join(' ').toLowerCase().includes(term);
        return matchesStatus && matchesQuery;
      })
      .sort((left, right) => {
        if (taskSort === 'Assignee') return left.assignee.localeCompare(right.assignee);
        if (taskSort === 'Priority') return (priorityRank[right.priority] ?? 0) - (priorityRank[left.priority] ?? 0);
        return left.dueDate.localeCompare(right.dueDate);
      });
  }, [searchQuery, taskData, taskFilter, taskSort]);

  const taskTotalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = filteredTasks.slice((taskPage - 1) * pageSize, taskPage * pageSize);

  const filteredSprints = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return sprintData.filter((sprint) => {
      const matchesStatus = sprintFilter === 'All' || sprint.status === sprintFilter;
      const matchesQuery =
        !term ||
        [sprint.id, sprint.name, sprint.project, sprint.status, sprint.goal].join(' ').toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [searchQuery, sprintData, sprintFilter]);

  const liveProjects = filteredProjects;
  const liveSprints = filteredSprints;
  const liveTasks = filteredTasks;
  const activeSprints = liveSprints.length > 0 ? liveSprints : sprintBlueprints;
  const sprintTotalPages = Math.max(1, Math.ceil(activeSprints.length / pageSize));
  const paginatedSprints = activeSprints.slice((sprintPage - 1) * pageSize, sprintPage * pageSize);

  const collaborationTotalPages = Math.max(1, Math.ceil(activity.length / pageSize));
  const paginatedActivity = activity.slice((collaborationPage - 1) * pageSize, collaborationPage * pageSize);

  const resourceTotalPages = Math.max(1, Math.ceil(team.length / pageSize));
  const paginatedTeam = team.slice((resourcePage - 1) * pageSize, resourcePage * pageSize);

  const timeTotalPages = Math.max(1, Math.ceil(timeEntries.length / pageSize));
  const paginatedTimeEntries = timeEntries.slice((timePage - 1) * pageSize, timePage * pageSize);

  const clientRows = liveProjects;
  const clientTotalPages = Math.max(1, Math.ceil(clientRows.length / pageSize));
  const paginatedClientRows = clientRows.slice((clientPage - 1) * pageSize, clientPage * pageSize);

  const reportMilestoneTotalPages = Math.max(1, Math.ceil(projectMilestones.length / pageSize));
  const paginatedMilestones = projectMilestones.slice((reportPage - 1) * pageSize, reportPage * pageSize);

  const adminTotalPages = Math.max(1, Math.ceil(adminUsers.length / pageSize));
  const paginatedAdminUsers = adminUsers.slice((adminPage - 1) * pageSize, adminPage * pageSize);

  const totalTimeHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const billableTimeHours = timeEntries.reduce((sum, entry) => sum + (entry.billable ? entry.hours : 0), 0);
  const customerOptions = Array.from(new Set(projectData.map((project) => project.client).filter(Boolean)));
  const employeeOptions = Array.from(new Set([...team.map((member) => member.name), ...adminUsers.map((user) => user.name)]));
  const projectLinkOptions = Array.from(new Set(projectData.map((project) => `${project.code} · ${project.name}`)));
  const taskParentOptions = Array.from(new Set(taskData.map((task) => `${task.id} · ${task.title}`)));

  const projectManagerField = import.meta.env.VITE_ERPNEXT_PROJECT_MANAGER_FIELD?.trim() || 'custom_advbench_project_manager';
  const taskAssigneeField = import.meta.env.VITE_ERPNEXT_TASK_ASSIGNEE_FIELD?.trim() || 'custom_advbench_assignee';

  const selectedProject = drawer?.kind === 'project' ? drawer.item ?? liveProjects[0] : undefined;
  const selectedSprint = drawer?.kind === 'sprint' ? drawer.item ?? liveSprints[0] : undefined;
  const selectedTask = drawer?.kind === 'task' ? drawer.item ?? liveTasks[0] : undefined;

  const openProject = (mode: 'view' | 'create' | 'edit', item?: Project) => setDrawer({ kind: 'project', mode, item });
  const openSprint = (mode: 'view' | 'create' | 'edit', item?: Sprint) => setDrawer({ kind: 'sprint', mode, item });
  const openTask = (mode: 'view' | 'create' | 'edit', item?: Task) => setDrawer({ kind: 'task', mode, item });
  const closeDrawer = () => {
    setDrawer(null);
    if (searchParams.get('doc')) {
      const next = new URLSearchParams(searchParams);
      next.delete('doc');
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    setProjectPage(1);
  }, [projectFilter, searchQuery]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskFilter, taskSort, searchQuery]);

  useEffect(() => {
    setProjectPage((current) => Math.min(current, projectTotalPages));
  }, [projectTotalPages]);

  useEffect(() => {
    setTaskPage((current) => Math.min(current, taskTotalPages));
  }, [taskTotalPages]);

  useEffect(() => {
    setSprintPage(1);
    setCollaborationPage(1);
    setResourcePage(1);
    setTimePage(1);
    setClientPage(1);
    setReportPage(1);
    setAdminPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const doc = searchParams.get('doc');
    if (!doc) return;

    if (activeSection === 'projects') {
      const selected = projectData.find((project) => project.code === doc);
      if (selected && drawer?.kind !== 'project' && selectedProject?.code !== selected.code) {
        setDrawer({ kind: 'project', mode: 'view', item: selected });
      }
    }

    if (activeSection === 'tasks') {
      const selected = taskData.find((task) => task.id === doc);
      if (selected && drawer?.kind !== 'task' && selectedTask?.id !== selected.id) {
        setDrawer({ kind: 'task', mode: 'view', item: selected });
      }
    }
  }, [activeSection, drawer?.kind, projectData, searchParams, selectedProject?.code, selectedTask?.id, taskData]);

  if (activeSection === 'projects') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="dashboard-stack">
          <SectionFrame kicker="Projects" title="Projects">
            <div className="toolbar">
              {projectStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`chip ${projectFilter === status ? 'chip-active' : ''}`}
                  onClick={() => setProjectFilter(status)}
                >
                  {status}
                </button>
              ))}
              <button type="button" className="chip chip-active" onClick={() => openProject('create')}>
                Create Project
              </button>
            </div>

            {projectData.length === 0 ? (
              <p className="empty-copy">
                ERPNext did not return any projects. Please sync data or create the first project in ERPNext.
              </p>
            ) : paginatedProjects.length === 0 ? (
              <p className="empty-copy">No projects match the current filter or search query.</p>
            ) : (
              <div className="table">
                <div className="table-head project-head">
                  <span>Project</span>
                  <span>Customer</span>
                  <span>Creator</span>
                  <span>Status</span>
                  <span>Completion</span>
                  <span>Budget</span>
                </div>
                {paginatedProjects.map((project) => (
                  <button key={project.code} type="button" className="table-row table-row-button project-row" onClick={() => openProject('view', project)}>
                    <div className="card-field" data-label="Project">
                      <strong>{project.name}</strong>
                      <span>
                        {project.code} · {project.client}
                      </span>
                    </div>
                    <div className="card-field" data-label="Customer">
                      <span>{project.client}</span>
                      <small>Customer</small>
                    </div>
                    <div className="card-field" data-label="Creator">
                      <span>{project.manager}</span>
                      <small>Manager</small>
                    </div>
                    <div className="card-field" data-label="Status">
                      <span>{project.status}</span>
                      <small>{project.priority}</small>
                    </div>
                    <div className="card-field" data-label="Completion">
                      <span>{project.progress}%</span>
                      <small>Complete</small>
                    </div>
                    <div className="card-field" data-label="Budget">
                      <span>${project.budget.toLocaleString()}</span>
                      <small>Budget</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <PaginationControls
              page={projectPage}
              totalPages={projectTotalPages}
              totalCount={filteredProjects.length}
              start={filteredProjects.length === 0 ? 0 : (projectPage - 1) * pageSize + 1}
              end={Math.min(projectPage * pageSize, filteredProjects.length)}
              onPrev={() => setProjectPage((current) => Math.max(1, current - 1))}
              onNext={() => setProjectPage((current) => Math.min(projectTotalPages, current + 1))}
            />
          </SectionFrame>
        </section>

        <DetailDrawer
          open={Boolean(drawer && drawer.kind === 'project')}
          title={drawer?.mode === 'create' ? 'Create Project' : selectedProject?.name ?? 'Project Details'}
          subtitle={selectedProject ? selectedProject.code : 'Create or inspect a live ERPNext project'}
          onClose={closeDrawer}
        >
          {drawer?.mode === 'view' && selectedProject ? (
            <div className="detail-stack">
              <FieldRow label="Code" value={selectedProject.code} />
              <FieldRow label="Client" value={selectedProject.client} />
              <FieldRow label="Manager" value={selectedProject.manager} />
              <FieldRow label="Project Type" value={selectedProject.projectType ?? 'Not set'} />
              <FieldRow label="Status" value={selectedProject.status} />
              <FieldRow label="Priority" value={selectedProject.priority} />
              <FieldRow label="% Complete Method" value={selectedProject.progressMethod ?? 'Manual'} />
              <FieldRow label="Progress" value={`${selectedProject.progress}%`} />
              <FieldRow label="Budget" value={`$${selectedProject.budget.toLocaleString()}`} />
              <FieldRow label="Start Date" value={selectedProject.startDate ?? 'Not set'} />
              <FieldRow label="End Date" value={selectedProject.endDate ?? 'Not set'} />
              <FieldRow label="Estimated Cost" value={`$${(selectedProject.estimatedCost ?? selectedProject.budget).toLocaleString()}`} />
              <FieldRow label="Is Active" value={selectedProject.isActive ?? 'Unknown'} />
              <FieldRow label="Company" value={selectedProject.company ?? 'Not set'} />
              <FieldRow label="Cost Center" value={selectedProject.costCenter ?? 'Not set'} />
              <FieldRow label="Notes" value={selectedProject.notes ?? 'Not set'} />
              <div className="form-actions">
                <button type="button" className="primary-btn" onClick={() => openProject('edit', selectedProject)}>
                  Edit Project
                </button>
                <form action="/api/projects/delete" method="post">
                  <input type="hidden" name="docname" value={selectedProject.code} />
                  <input type="hidden" name="returnTo" value="/projects" />
                  <button type="submit" className="secondary-btn danger-btn">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form className="editor-form" action="/api/projects/save" method="post">
              <input type="hidden" name="returnTo" value="/projects" />
              {drawer?.mode === 'edit' && selectedProject ? <input type="hidden" name="docname" value={selectedProject.code} /> : null}
              <div className="form-grid">
                <label>
                  <span>Project Name</span>
                  <input name="project_name" defaultValue={selectedProject?.name ?? ''} placeholder="ERPNext project name" required />
                </label>
                <LinkField
                  label="Customer"
                  name="customer"
                  defaultValue={selectedProject?.client ?? ''}
                  options={customerOptions}
                  placeholder="Search customer"
                  doctype="Customer"
                  required
                />
                <LinkField
                  label="Project Manager"
                  name={projectManagerField}
                  defaultValue={selectedProject?.manager ?? ''}
                  options={employeeOptions}
                  placeholder="Search employee"
                  doctype="Employee"
                />
                <label>
                  <span>Project Type</span>
                  <input name="project_type" defaultValue={selectedProject?.projectType ?? ''} placeholder="Implementation" />
                </label>
                <label>
                  <span>Status</span>
                  <input name="status" defaultValue={selectedProject?.status ?? 'Open'} placeholder="Open" />
                </label>
                <label>
                  <span>Priority</span>
                  <select name="priority" defaultValue={selectedProject?.priority ?? 'Medium'}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </label>
                <label>
                  <span>Progress %</span>
                  <input name="percent_complete" defaultValue={selectedProject?.progress?.toString() ?? '0'} inputMode="numeric" />
                </label>
                <label>
                  <span>% Complete Method</span>
                  <select name="percent_complete_method" defaultValue={selectedProject?.progressMethod ?? 'Manual'}>
                    <option>Manual</option>
                    <option>Task Completion</option>
                    <option>Task Progress</option>
                    <option>Task Weight</option>
                  </select>
                </label>
                <label>
                  <span>Expected Start Date</span>
                  <input name="expected_start_date" type="date" defaultValue={selectedProject?.expectedStartDate ?? selectedProject?.startDate ?? ''} />
                </label>
                <label>
                  <span>Expected End Date</span>
                  <input name="expected_end_date" type="date" defaultValue={selectedProject?.expectedEndDate ?? selectedProject?.endDate ?? ''} />
                </label>
                <label>
                  <span>Estimated Cost</span>
                  <input name="estimated_costing" defaultValue={String(selectedProject?.estimatedCost ?? selectedProject?.budget ?? 0)} inputMode="numeric" />
                </label>
                <label>
                  <span>Is Active</span>
                  <select name="is_active" defaultValue={selectedProject?.isActive ?? 'Yes'}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                <label>
                  <span>Company</span>
                  <input name="company" defaultValue={selectedProject?.company ?? ''} placeholder="Company" />
                </label>
                <label>
                  <span>Cost Center</span>
                  <input name="cost_center" defaultValue={selectedProject?.costCenter ?? ''} placeholder="Cost center" />
                </label>
                <label className="full-span">
                  <span>Notes</span>
                  <textarea name="notes" defaultValue={selectedProject?.notes ?? ''} placeholder="Project notes" rows={4} />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  Save Project
                </button>
                {drawer?.mode === 'edit' && selectedProject ? (
                  <button type="button" className="secondary-btn" onClick={() => openProject('view', selectedProject)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </DetailDrawer>
      </>
    );
  }

  if (activeSection === 'tasks') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="dashboard-stack">
          <SectionFrame kicker="Tasks" title="Tasks">
            <div className="toolbar">
              {taskStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`chip ${taskFilter === status ? 'chip-active' : ''}`}
                  onClick={() => setTaskFilter(status)}
                >
                  {status}
                </button>
              ))}
              {taskSorts.map((sort) => (
                <button key={sort} type="button" className={`chip ${taskSort === sort ? 'chip-active' : ''}`} onClick={() => setTaskSort(sort)}>
                  Sort: {sort}
                </button>
              ))}
              <button type="button" className="chip chip-active" onClick={() => openTask('create')}>
                Create Task
              </button>
            </div>

            {taskData.length === 0 ? (
              <p className="empty-copy">
                ERPNext did not return any tasks. Please sync data or create the first task in ERPNext.
              </p>
            ) : paginatedTasks.length === 0 ? (
              <p className="empty-copy">No tasks match the current filter or search query.</p>
            ) : (
              <div className="task-list">
                <div className="table-head task-head">
                  <span>Task</span>
                  <span>Project</span>
                  <span>Assignee</span>
                  <span>Status</span>
                  <span>Due</span>
                  <span>Estimate</span>
                </div>
                {paginatedTasks.map((task) => (
                  <button key={task.id} type="button" className="task-card task-card-button task-row" onClick={() => openTask('view', task)}>
                    <div className="card-field" data-label="Task">
                      <strong>{task.title}</strong>
                      <span>
                        {task.id}
                      </span>
                    </div>
                    <div className="card-field" data-label="Project">
                      <span>{task.project}</span>
                      <small>Project</small>
                    </div>
                    <div className="card-field" data-label="Assignee">
                      <span>{task.assignee}</span>
                      <small>Assignee</small>
                    </div>
                    <div className="card-field" data-label="Status">
                      <span>{task.status}</span>
                      <small className={`pill ${task.priority.toLowerCase()}`}>{task.priority}</small>
                    </div>
                    <div className="card-field" data-label="Due">
                      <span>{task.dueDate}</span>
                      <small>Due date</small>
                    </div>
                    <div className="card-field" data-label="Estimate">
                      <span>{task.estimate}h</span>
                      <small>{task.actual}h logged</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <PaginationControls
              page={taskPage}
              totalPages={taskTotalPages}
              totalCount={filteredTasks.length}
              start={filteredTasks.length === 0 ? 0 : (taskPage - 1) * pageSize + 1}
              end={Math.min(taskPage * pageSize, filteredTasks.length)}
              onPrev={() => setTaskPage((current) => Math.max(1, current - 1))}
              onNext={() => setTaskPage((current) => Math.min(taskTotalPages, current + 1))}
            />
          </SectionFrame>
        </section>

        <DetailDrawer
          open={Boolean(drawer && drawer.kind === 'task')}
          title={drawer?.mode === 'create' ? 'Create Task' : selectedTask?.title ?? 'Task Details'}
          subtitle={selectedTask ? selectedTask.id : 'Create or inspect a live ERPNext task'}
          onClose={closeDrawer}
        >
          {drawer?.mode === 'view' && selectedTask ? (
            <div className="detail-stack">
              <FieldRow label="ID" value={selectedTask.id} />
              <FieldRow label="Project" value={selectedTask.project} />
              <FieldRow label="Assignee" value={selectedTask.assignee} />
              <FieldRow label="Description" value={selectedTask.description ?? 'Not set'} />
              <FieldRow label="Status" value={selectedTask.status} />
              <FieldRow label="Priority" value={selectedTask.priority} />
              <FieldRow label="Estimate / Actual" value={`${selectedTask.estimate}h / ${selectedTask.actual}h`} />
              <FieldRow label="Expected Start" value={selectedTask.expStartDate ?? 'Not set'} />
              <FieldRow label="Expected End" value={selectedTask.expEndDate ?? 'Not set'} />
              <FieldRow label="Progress" value={`${selectedTask.progress ?? 0}%`} />
              <FieldRow label="Parent Task" value={selectedTask.parentTask ?? 'Not set'} />
              <FieldRow label="Due Date" value={selectedTask.dueDate} />
              <FieldRow label="Story Points" value={String(selectedTask.storyPoints ?? 0)} />
              <FieldRow label="Company" value={selectedTask.company ?? 'Not set'} />
              <FieldRow label="Department" value={selectedTask.department ?? 'Not set'} />
              <div className="form-actions">
                <button type="button" className="primary-btn" onClick={() => openTask('edit', selectedTask)}>
                  Edit Task
                </button>
                <form action="/api/tasks/delete" method="post">
                  <input type="hidden" name="docname" value={selectedTask.id} />
                  <input type="hidden" name="returnTo" value="/tasks" />
                  <button type="submit" className="secondary-btn danger-btn">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form className="editor-form" action="/api/tasks/save" method="post">
              <input type="hidden" name="returnTo" value="/tasks" />
              {drawer?.mode === 'edit' && selectedTask ? <input type="hidden" name="docname" value={selectedTask.id} /> : null}
              <div className="form-grid">
                <label>
                  <span>Subject</span>
                  <input name="subject" defaultValue={selectedTask?.title ?? ''} placeholder="Task subject" required />
                </label>
                <LinkField
                  label="Project"
                  name="project"
                  defaultValue={selectedTask?.project ?? ''}
                  options={projectLinkOptions}
                  placeholder="Search project"
                  doctype="Project"
                  required
                />
                <LinkField
                  label="Assignee"
                  name={taskAssigneeField}
                  defaultValue={selectedTask?.assignee ?? ''}
                  options={employeeOptions}
                  placeholder="Search employee"
                  doctype="Employee"
                />
                <label>
                  <span>Status</span>
                  <input name="status" defaultValue={selectedTask?.status ?? 'Open'} placeholder="Open" />
                </label>
                <label>
                  <span>Priority</span>
                  <select name="priority" defaultValue={selectedTask?.priority ?? 'Medium'}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </label>
                <label>
                  <span>Expected Start Date</span>
                  <input name="exp_start_date" type="date" defaultValue={selectedTask?.expStartDate ?? ''} />
                </label>
                <label>
                  <span>Expected End Date</span>
                  <input name="exp_end_date" type="date" defaultValue={selectedTask?.expEndDate ?? ''} />
                </label>
                <label>
                  <span>Expected Time</span>
                  <input name="expected_time" defaultValue={selectedTask?.estimate?.toString() ?? '0'} inputMode="numeric" />
                </label>
                <label>
                  <span>Actual Time</span>
                  <input name="actual_time" defaultValue={selectedTask?.actual?.toString() ?? '0'} inputMode="numeric" />
                </label>
                <label>
                  <span>Progress %</span>
                  <input name="progress" defaultValue={selectedTask?.progress?.toString() ?? '0'} inputMode="numeric" />
                </label>
                <label>
                  <span>Parent Task</span>
                  <input name="parent_task" list="parent-task-options" defaultValue={selectedTask?.parentTask ?? ''} placeholder="Search parent task" />
                  <datalist id="parent-task-options">
                    {taskParentOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>
                <label>
                  <span>Due Date</span>
                  <input name="due_date" type="date" defaultValue={selectedTask?.dueDate ?? ''} />
                </label>
                <label>
                  <span>Story Points</span>
                  <input name="story_points" defaultValue={selectedTask?.storyPoints?.toString() ?? '0'} inputMode="numeric" />
                </label>
                <label>
                  <span>Company</span>
                  <input name="company" defaultValue={selectedTask?.company ?? ''} placeholder="Company" />
                </label>
                <label>
                  <span>Department</span>
                  <input name="department" defaultValue={selectedTask?.department ?? ''} placeholder="Department" />
                </label>
                <label className="full-span">
                  <span>Description</span>
                  <textarea name="description" defaultValue={selectedTask?.description ?? ''} placeholder="Task description" rows={4} />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  Save Task
                </button>
                {drawer?.mode === 'edit' && selectedTask ? (
                  <button type="button" className="secondary-btn" onClick={() => openTask('view', selectedTask)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </DetailDrawer>
      </>
    );
  }

  if (activeSection === 'collaboration') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="content-grid">
          <SectionFrame kicker="Activity" title="Recent team movement">
            <div className="activity-feed">
              {paginatedActivity.map((item) => (
                <div key={`${item.title}-${item.time}`} className="activity-item">
                  <strong>{item.title}</strong>
                  <span>{item.time}</span>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>
            <PaginationControls
              page={collaborationPage}
              totalPages={collaborationTotalPages}
              totalCount={activity.length}
              start={activity.length === 0 ? 0 : (collaborationPage - 1) * pageSize + 1}
              end={Math.min(collaborationPage * pageSize, activity.length)}
              onPrev={() => setCollaborationPage((current) => Math.max(1, current - 1))}
              onNext={() => setCollaborationPage((current) => Math.min(collaborationTotalPages, current + 1))}
            />
          </SectionFrame>

          <SectionFrame kicker="People" title="Available collaborators" badge={`${team.length} members`}>
            <div className="team-list">
              {paginatedTeam.map((member) => (
                <div key={member.name} className="team-card">
                  <div className="team-card-header">
                    <div>
                      <strong>{member.name}</strong>
                      <span>
                        {member.designation} · {member.department}
                      </span>
                    </div>
                    <span className="pill">{member.utilization}%</span>
                  </div>
                  <div className="skills">
                    {member.skills.map((skill) => (
                      <span key={skill} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <span>
                    {member.currentProject} · {member.currentTask}
                  </span>
                </div>
              ))}
            </div>
            <PaginationControls
              page={resourcePage}
              totalPages={resourceTotalPages}
              totalCount={team.length}
              start={team.length === 0 ? 0 : (resourcePage - 1) * pageSize + 1}
              end={Math.min(resourcePage * pageSize, team.length)}
              onPrev={() => setResourcePage((current) => Math.max(1, current - 1))}
              onNext={() => setResourcePage((current) => Math.min(resourceTotalPages, current + 1))}
            />
          </SectionFrame>
        </section>
      </>
    );
  }

  if (activeSection === 'sprints') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="content-grid">
          <SectionFrame kicker="Sprint Board" title="Current sprint windows">
            <div className="toolbar">
              {sprintStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`chip ${sprintFilter === status ? 'chip-active' : ''}`}
                  onClick={() => setSprintFilter(status)}
                >
                  {status}
                </button>
              ))}
              <button type="button" className="chip chip-active" onClick={() => openSprint('create')}>
                Create Sprint
              </button>
            </div>

            {activeSprints.length === 0 ? (
              <p className="empty-copy">No sprint records are available yet.</p>
            ) : (
              <div className="table">
                {paginatedSprints.map((sprint) => (
                  <button key={sprint.id} type="button" className="table-row table-row-button" onClick={() => openSprint('view', sprint)}>
                    <div>
                      <strong>{sprint.name}</strong>
                      <span>
                        {sprint.id} · {sprint.project}
                      </span>
                    </div>
                    <div>
                      <span>{sprint.status}</span>
                      <small>
                        {sprint.completedPoints}/{sprint.plannedPoints} pts
                      </small>
                    </div>
                    <div>
                      <span>{sprint.goal}</span>
                      <small>Goal</small>
                    </div>
                    <div>
                      <span>{sprint.velocity} vel</span>
                      <small>
                        {sprint.startDate} → {sprint.endDate}
                      </small>
                    </div>
                    <div>
                      <span className={`pill ${sprint.status.toLowerCase()}`}>{Math.round((sprint.completedPoints / Math.max(sprint.plannedPoints, 1)) * 100)}%</span>
                      <small>Open detail drawer</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <PaginationControls
              page={sprintPage}
              totalPages={sprintTotalPages}
              totalCount={activeSprints.length}
              start={activeSprints.length === 0 ? 0 : (sprintPage - 1) * pageSize + 1}
              end={Math.min(sprintPage * pageSize, activeSprints.length)}
              onPrev={() => setSprintPage((current) => Math.max(1, current - 1))}
              onNext={() => setSprintPage((current) => Math.min(sprintTotalPages, current + 1))}
            />
          </SectionFrame>

          <SectionFrame kicker="Milestones" title="Upcoming sprint checkpoints">
            <div className="deadline-list">
              {paginatedMilestones.map((milestone) => (
                <div key={milestone.title} className="deadline-item">
                  <strong>{milestone.title}</strong>
                  <span>
                    {milestone.owner} · {milestone.due} · {milestone.status}
                  </span>
                </div>
              ))}
            </div>
            <PaginationControls
              page={reportPage}
              totalPages={reportMilestoneTotalPages}
              totalCount={projectMilestones.length}
              start={projectMilestones.length === 0 ? 0 : (reportPage - 1) * pageSize + 1}
              end={Math.min(reportPage * pageSize, projectMilestones.length)}
              onPrev={() => setReportPage((current) => Math.max(1, current - 1))}
              onNext={() => setReportPage((current) => Math.min(reportMilestoneTotalPages, current + 1))}
            />
          </SectionFrame>
        </section>

        <DetailDrawer
          open={Boolean(drawer && drawer.kind === 'sprint')}
          title={drawer?.mode === 'create' ? 'Create Sprint' : selectedSprint?.name ?? 'Sprint Details'}
          subtitle={selectedSprint ? selectedSprint.id : 'Create or inspect a sprint'}
          onClose={() => setDrawer(null)}
        >
          {drawer?.mode === 'view' && selectedSprint ? (
            <div className="detail-stack">
              <FieldRow label="ID" value={selectedSprint.id} />
              <FieldRow label="Project" value={selectedSprint.project} />
              <FieldRow label="Status" value={selectedSprint.status} />
              <FieldRow label="Goal" value={selectedSprint.goal} />
              <FieldRow label="Planned Points" value={String(selectedSprint.plannedPoints)} />
              <FieldRow label="Completed Points" value={String(selectedSprint.completedPoints)} />
              <FieldRow label="Velocity" value={String(selectedSprint.velocity)} />
              <FieldRow label="Start Date" value={selectedSprint.startDate} />
              <FieldRow label="End Date" value={selectedSprint.endDate} />
              <div className="form-actions">
                <button type="button" className="primary-btn" onClick={() => openSprint('edit', selectedSprint)}>
                  Edit Sprint
                </button>
                <form action="/api/sprints/delete" method="post">
                  <input type="hidden" name="docname" value={selectedSprint.id} />
                  <input type="hidden" name="returnTo" value="/sprints" />
                  <button type="submit" className="secondary-btn danger-btn">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form className="editor-form" action="/api/sprints/save" method="post">
              <input type="hidden" name="returnTo" value="/sprints" />
              {drawer?.mode === 'edit' && selectedSprint ? <input type="hidden" name="docname" value={selectedSprint.id} /> : null}
              <div className="form-grid">
                <label>
                  <span>Sprint Name</span>
                  <input name="sprint_name" defaultValue={selectedSprint?.name ?? ''} placeholder="Sprint name" required />
                </label>
                <label>
                  <span>Project</span>
                  <input name="project" defaultValue={selectedSprint?.project ?? ''} placeholder="PROJ-0001" />
                </label>
                <label>
                  <span>Status</span>
                  <input name="status" defaultValue={selectedSprint?.status ?? 'Planning'} placeholder="Planning" />
                </label>
                <label>
                  <span>Start Date</span>
                  <input name="start_date" type="date" defaultValue={selectedSprint?.startDate ?? ''} />
                </label>
                <label>
                  <span>End Date</span>
                  <input name="end_date" type="date" defaultValue={selectedSprint?.endDate ?? ''} />
                </label>
                <label>
                  <span>Goal</span>
                  <input name="goal" defaultValue={selectedSprint?.goal ?? ''} placeholder="Delivery goal" />
                </label>
                <label>
                  <span>Planned Points</span>
                  <input name="planned_points" defaultValue={selectedSprint?.plannedPoints?.toString() ?? '0'} inputMode="numeric" />
                </label>
                <label>
                  <span>Completed Points</span>
                  <input name="completed_points" defaultValue={selectedSprint?.completedPoints?.toString() ?? '0'} inputMode="numeric" />
                </label>
                <label>
                  <span>Velocity</span>
                  <input name="velocity" defaultValue={selectedSprint?.velocity?.toString() ?? '0'} inputMode="numeric" />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  Save Sprint
                </button>
                {drawer?.mode === 'edit' && selectedSprint ? (
                  <button type="button" className="secondary-btn" onClick={() => openSprint('view', selectedSprint)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </DetailDrawer>
      </>
    );
  }

  if (activeSection === 'resources') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="dashboard-stack">
          <SectionFrame kicker="Capacity" title="Team utilization">
            <div className="team-list">
              {paginatedTeam.map((member) => (
                <div key={member.name} className="team-card">
                  <div className="team-card-header">
                    <div>
                      <strong>{member.name}</strong>
                      <span>
                        {member.designation} · {member.department}
                      </span>
                    </div>
                    <span className={`pill ${member.utilization >= 85 ? 'tone-bad' : member.utilization >= 70 ? 'tone-warn' : 'tone-good'}`}>
                      {member.utilization}%
                    </span>
                  </div>
                  <div className="bar-track" style={{ margin: '12px 0' }}>
                    <div className={`bar ${member.utilization >= 85 ? 'bad' : member.utilization >= 70 ? 'warn' : 'good'}`} style={{ width: `${member.utilization}%` }} />
                  </div>
                  <div className="skills">
                    {member.skills.map((skill) => (
                      <span key={skill} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <span>
                    {member.currentProject} · {member.currentTask}
                  </span>
                </div>
              ))}
            </div>
            <PaginationControls
              page={resourcePage}
              totalPages={resourceTotalPages}
              totalCount={team.length}
              start={team.length === 0 ? 0 : (resourcePage - 1) * pageSize + 1}
              end={Math.min(resourcePage * pageSize, team.length)}
              onPrev={() => setResourcePage((current) => Math.max(1, current - 1))}
              onNext={() => setResourcePage((current) => Math.min(resourceTotalPages, current + 1))}
            />
          </SectionFrame>

          <SectionFrame kicker="Bench" title="Skill coverage">
            <div className="detail-stack">
              {paginatedTeam.map((member) => (
                <div key={member.name} className="detail-row">
                  <span>{member.name}</span>
                  <strong>{member.skills.join(', ')}</strong>
                </div>
              ))}
            </div>
          </SectionFrame>
        </section>
      </>
    );
  }

  if (activeSection === 'time-tracking') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="dashboard-stack">
          <SectionFrame kicker="Timesheets" title="Recent logged hours" badge={`${totalTimeHours.toFixed(1)}h total`}>
            <div className="activity-feed">
              {paginatedTimeEntries.map((entry) => (
                <div key={`${entry.employee}-${entry.date}-${entry.task}`} className="activity-item">
                  <strong>{entry.task}</strong>
                  <span>
                    {entry.employee} · {entry.project} · {entry.date}
                  </span>
                  <small>
                    {entry.hours}h logged · {entry.billable ? 'Billable' : 'Non-billable'} · {entry.note}
                  </small>
                </div>
              ))}
            </div>
            <PaginationControls
              page={timePage}
              totalPages={timeTotalPages}
              totalCount={timeEntries.length}
              start={timeEntries.length === 0 ? 0 : (timePage - 1) * pageSize + 1}
              end={Math.min(timePage * pageSize, timeEntries.length)}
              onPrev={() => setTimePage((current) => Math.max(1, current - 1))}
              onNext={() => setTimePage((current) => Math.min(timeTotalPages, current + 1))}
            />
          </SectionFrame>

          <SectionFrame kicker="Summary" title="Billable mix and utilization">
            <div className="detail-stack">
              <div className="detail-row">
                <span>Total hours</span>
                <strong>{totalTimeHours.toFixed(1)}h</strong>
              </div>
              <div className="detail-row">
                <span>Billable hours</span>
                <strong>{billableTimeHours.toFixed(1)}h</strong>
              </div>
              <div className="detail-row">
                <span>Non-billable hours</span>
                <strong>{(totalTimeHours - billableTimeHours).toFixed(1)}h</strong>
              </div>
            </div>
          </SectionFrame>
        </section>
      </>
    );
  }

  if (activeSection === 'clients') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="dashboard-stack">
          <SectionFrame kicker="Accounts" title="Client-facing portfolio">
            <div className="table">
              {paginatedClientRows.map((project) => (
                <div key={project.code} className="table-row">
                  <div>
                    <strong>{project.client}</strong>
                    <span>
                      {project.code} · {project.name}
                    </span>
                  </div>
                  <div>
                    <span>{project.manager}</span>
                    <small>{project.status}</small>
                  </div>
                  <div>
                    <span>{project.progress}%</span>
                    <small>${project.budget.toLocaleString()}</small>
                  </div>
                  <div>
                    <span className={`pill ${project.priority.toLowerCase()}`}>{project.priority}</span>
                    <small>Due {project.dueDate}</small>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={clientPage}
              totalPages={clientTotalPages}
              totalCount={clientRows.length}
              start={clientRows.length === 0 ? 0 : (clientPage - 1) * pageSize + 1}
              end={Math.min(clientPage * pageSize, clientRows.length)}
              onPrev={() => setClientPage((current) => Math.max(1, current - 1))}
              onNext={() => setClientPage((current) => Math.min(clientTotalPages, current + 1))}
            />
          </SectionFrame>

          <SectionFrame kicker="Risks" title="Open client escalations">
            <div className="activity-feed">
              {projectRisks.map((risk) => (
                <div key={risk.project} className="activity-item">
                  <strong>{risk.project}</strong>
                  <span>
                    Owner: {risk.owner} · Severity: {risk.severity}
                  </span>
                  <small>{risk.risk}</small>
                </div>
              ))}
            </div>
          </SectionFrame>
        </section>
      </>
    );
  }

  if (activeSection === 'reports') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="metrics-grid">
          {reportCards.map((card) => (
            <article key={card.title} className={`metric-card tone-${card.tone}`}>
              <span>{card.title}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </article>
          ))}
        </section>

        <section className="dashboard-stack">
          <SectionFrame kicker="Milestones" title="Recent delivery checkpoints">
            <div className="deadline-list">
              {paginatedMilestones.map((milestone) => (
                <div key={milestone.title} className="deadline-item">
                  <strong>{milestone.title}</strong>
                  <span>
                    {milestone.owner} · {milestone.due} · {milestone.status}
                  </span>
                </div>
              ))}
            </div>
            <PaginationControls
              page={reportPage}
              totalPages={reportMilestoneTotalPages}
              totalCount={projectMilestones.length}
              start={projectMilestones.length === 0 ? 0 : (reportPage - 1) * pageSize + 1}
              end={Math.min(reportPage * pageSize, projectMilestones.length)}
              onPrev={() => setReportPage((current) => Math.max(1, current - 1))}
              onNext={() => setReportPage((current) => Math.min(reportMilestoneTotalPages, current + 1))}
            />
          </SectionFrame>

          <SectionFrame kicker="Signals" title="Portfolio health">
            <div className="detail-stack">
              <div className="detail-row">
                <span>On-track projects</span>
                <strong>{liveProjects.filter((project) => project.health === 'on-track').length}</strong>
              </div>
              <div className="detail-row">
                <span>At-risk projects</span>
                <strong>{liveProjects.filter((project) => project.health === 'risk').length}</strong>
              </div>
              <div className="detail-row">
                <span>Delayed projects</span>
                <strong>{liveProjects.filter((project) => project.health === 'delayed').length}</strong>
              </div>
            </div>
          </SectionFrame>
        </section>
      </>
    );
  }

  if (activeSection === 'administration') {
    return (
      <>
        <Topbar title={title} description={description} />

        <section className="dashboard-stack">
          <SectionFrame kicker="Users" title="Workspace access">
            <div className="team-list">
              {paginatedAdminUsers.map((user) => (
                <div key={user.name} className="team-card">
                  <div className="team-card-header">
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.role}</span>
                    </div>
                    <span className="pill">{user.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={adminPage}
              totalPages={adminTotalPages}
              totalCount={adminUsers.length}
              start={adminUsers.length === 0 ? 0 : (adminPage - 1) * pageSize + 1}
              end={Math.min(adminPage * pageSize, adminUsers.length)}
              onPrev={() => setAdminPage((current) => Math.max(1, current - 1))}
              onNext={() => setAdminPage((current) => Math.min(adminTotalPages, current + 1))}
            />
          </SectionFrame>

          <SectionFrame kicker="Integrations" title="Platform checks">
            <div className="deadline-list">
              {integrationStatus.map((item) => (
                <div key={item.name} className="deadline-item">
                  <strong>{item.name}</strong>
                  <span>{item.state}</span>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>
          </SectionFrame>
        </section>
      </>
    );
  }

  return (
    <>
      <Topbar title={title} description={description} />
      <EmptyState title="No data" description="No live data is available right now." />
    </>
  );
}
