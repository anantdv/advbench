# ADVBench Product Requirements Document

## 1. Overview

**Product name:** ADVBench  
**Tagline:** Advanced Delivery & Visibility Bench

ADVBench is an internal project management and team collaboration platform for a software development company specializing in ERPNext customization and custom application development. The platform gives leadership and delivery teams a single place to track projects, tasks, sprint progress, workloads, collaboration, time tracking, client requests, and operational reporting.

The product should feel like a modern enterprise SaaS application with the clarity of Linear, the depth of Jira, and the collaboration flow of ClickUp, while remaining practical for ERPNext-based delivery teams.

## 2. Product Vision

Create a mobile-first, highly usable internal command center that helps the CTO and delivery organization answer, in real time:

- What is in flight?
- Who is overloaded?
- What is blocked or at risk?
- What is due next?
- How healthy is delivery across clients and teams?

ADVBench should reduce status-chasing, improve delivery visibility, and make team collaboration feel structured rather than fragmented across chat, spreadsheets, and ad hoc updates.

## 3. Goals

### Business Goals

- Improve visibility into project health, timelines, and team capacity.
- Reduce delivery risk through early detection of delays and workload imbalance.
- Centralize project communication, task updates, and time tracking.
- Support internal leadership reporting with reliable operational metrics.
- Provide a scalable foundation for future client-facing access.

### User Goals

- Help project managers coordinate work with less manual follow-up.
- Help team leads assign work confidently based on availability and skills.
- Help developers, QA, and designers focus on assigned work and updates.
- Help leadership monitor delivery across all active client engagements.

## 4. Primary Users and Roles

### CTO

- Full system access.
- Views executive dashboards, delivery health, utilization, and financial reporting.

### Project Manager

- Creates and manages projects.
- Assigns tasks and tracks milestones.
- Monitors project progress and team execution.

### Team Lead

- Manages assigned projects and team workload.
- Reassigns tasks, reviews progress, and resolves blockers.

### Developer

- Views and updates assigned tasks.
- Logs progress, comments, and time.

### QA Engineer

- Tracks testing tasks and defects.
- Updates test status and approvals.

### UI/UX Designer

- Manages design-related tasks and assets.
- Tracks design progress and file uploads.

### Future: Client

- Limited access to project progress, UAT, and change requests.

## 5. Product Scope

### In Scope for MVP

- Executive dashboard
- Project management
- Task management
- Collaboration and activity feed
- Sprint planning basics
- Team directory and utilization view
- Time tracking
- ERPNext API integration layer
- Role-based access control
- Responsive mobile-first UI

### Phase 2 Scope

- Advanced analytics and executive reporting
- Burndown and velocity charts
- Client portal and client workflows
- AI-powered summaries and workload recommendations
- Offline task updates and richer PWA behavior
- Expanded notifications and command palette actions

### Out of Scope for Initial Release

- Full public client portal
- Complex billing/invoicing workflows
- Deep HR or payroll functionality
- Custom ERPNext schema migrations unless required for integration

## 6. Information Architecture

### Main Navigation

- Dashboard
- Projects
- Tasks
- Collaboration
- Sprints
- Resources
- Time Tracking
- Clients
- Reports
- Administration

### Detailed Sections

#### Dashboard

- Project overview
- Team metrics
- Delivery metrics
- Project health chart
- Team workload heatmap
- Recent activity feed
- Upcoming deadlines

#### Projects

- Active Projects
- Milestones
- Risks
- Deliverables

#### Tasks

- My Tasks
- Team Tasks
- Backlog
- Kanban Board

#### Collaboration

- Discussions
- Activity Feed
- Announcements

#### Sprints

- Sprint Board
- Velocity
- Burndown

#### Resources

- Team Members
- Utilization
- Capacity
- Skills Matrix

#### Time Tracking

- Timesheets
- Work Logs
- Productivity

#### Clients

- Projects
- UAT
- Change Requests
- Escalations

#### Reports

- Delivery
- Financial
- Team
- Executive

#### Administration

- Users
- Roles
- Settings
- Integrations

## 7. Functional Requirements

### 7.1 Dashboard

The dashboard must provide a concise executive snapshot of delivery across the organization.

Required widgets:

- Total Projects
- Active Projects
- Completed Projects
- Delayed Projects
- Team Utilization %
- Tasks Completed
- Tasks In Progress
- Tasks Overdue
- Sprint Velocity
- Average Completion Time
- Bug Count
- Deployment Count
- Project Health chart
- Team workload heatmap
- Recent activity feed
- Upcoming deadlines

### 7.2 Project Management

Projects must support:

- Create, edit, archive, and clone actions
- Project timeline and milestones
- Project discussion and activity log
- Document tracking

Project data should include:

- Project code
- Project name
- Client
- Project manager
- Start date
- End date
- Status
- Priority
- Budget
- Description

Project statuses:

- Planning
- Analysis
- Development
- UAT
- Deployment
- Support
- Completed
- On Hold

### 7.3 Task Management

Task management is the core workflow of the product.

Task fields:

- Task ID
- Task title
- Description
- Project
- Module
- Priority
- Status
- Story points
- Due date
- Estimated hours
- Actual hours

Assignment support:

- Single user
- Multiple users
- Team
- Reassign
- Collaborators

Statuses:

- Backlog
- To Do
- In Progress
- In Review
- Testing
- Blocked
- Completed
- Cancelled

Views:

- Kanban
- List
- Calendar
- Timeline

Filters:

- Project
- Status
- Priority
- Assignee
- Due date

### 7.4 Collaboration

Each project must have a dedicated collaboration space.

Supported actions:

- Comment
- Reply
- Mention users with `@username`
- React to comments
- View project-level discussion boards
- Track activity feed events

Notifications should cover:

- Task assigned
- Task updated
- Comment added
- Mention received
- Deadline approaching

### 7.5 Team Management

The platform should include an employee directory and capability visibility.

Directory data:

- Name
- Designation
- Skills
- Department
- Current projects
- Current tasks
- Utilization %

Skill matrix should support search and filtering by skills such as:

- ERPNext
- Frappe
- React
- Python
- DevOps
- UI/UX
- QA

### 7.6 Workload Management

The manager view must clearly show capacity and allocation.

Capacity metrics:

- Available hours
- Allocated hours
- Remaining capacity

Workload indicators:

- Green: 0-70%
- Yellow: 70-90%
- Red: 90%+

### 7.7 Time Tracking

Users should be able to log time against tasks.

Time entry fields:

- Task
- Start time
- End time
- Duration
- Notes

Features:

- Start timer
- Stop timer
- Manual entry
- Weekly timesheet
- Monthly timesheet

### 7.8 Sprint Management

Support agile delivery with:

- Sprint creation
- Sprint planning
- Sprint backlog
- Sprint burndown chart
- Sprint velocity chart
- Sprint review dashboard

### 7.9 Reports and Analytics

Reporting should support:

- Project progress
- Project health
- Project timeline
- Milestone tracking
- Productivity report
- Utilization report
- Attendance report
- Time tracking report
- Revenue by project
- Profitability
- Resource allocation
- Delivery performance

### 7.10 AI Features

AI capabilities should be treated as enhancements, not dependencies for core workflows.

Potential AI features:

- Project summary generation
- Daily standup summaries
- Risk detection for delayed projects
- Workload balancing recommendations

## 8. ERPNext Integration Requirements

ADVBench must integrate cleanly with ERPNext and custom Frappe app APIs.

Required integration areas:

- Employees
- Projects
- Tasks
- Timesheets
- Customers
- Sales Orders

Integration requirements:

- Reusable API service layer
- React Query hooks for server state
- Authentication support
- Refresh token handling
- Role-based access control
- Audit logging for sensitive actions

## 9. UX and Design Requirements

The product should be polished, responsive, and suitable for enterprise internal use.

Design principles:

- Mobile-first layout
- Desktop sidebar navigation
- Bottom navigation on mobile
- Touch-friendly controls
- Fast loading and responsive interactions
- Clean, modern SaaS visual language

UI expectations:

- High quality cards and dashboards
- Smooth transitions and motion
- Beautiful data visualizations
- Dark mode support
- Global search
- Command palette
- Keyboard shortcuts

Visual direction should align with enterprise tools such as Jira, ClickUp, Monday.com, Linear, and Asana, but feel more focused and less generic.

## 10. Technical Requirements

### Frontend

- React 19
- Vite
- TypeScript
- TailwindCSS
- Shadcn/UI
- TanStack Query
- Zustand
- React Router
- Recharts
- Framer Motion

### Architecture Expectations

- Modular folder structure
- Reusable UI components
- Strong TypeScript interfaces
- Centralized API client layer
- Separation of server state and local UI state
- Mock/sample data support for development

### Platform Support

- iPhone
- Android
- Tablet
- Desktop
- PWA-ready behavior

### Offline and Performance

- Offline support for task updates where feasible
- Fast initial load
- Responsive navigation and charts
- Optimized mobile interactions

## 11. Data Model Considerations

Core entities likely include:

- Users
- Roles
- Teams
- Projects
- Milestones
- Tasks
- Comments
- Notifications
- Sprints
- Timesheets
- Work logs
- Clients
- Change requests
- Escalations
- Reports
- Integrations
- Skills

Relationships should support:

- Projects containing many tasks, milestones, documents, and discussions
- Tasks assigned to one or many users or teams
- Users belonging to teams and possessing multiple skills
- Time logs tied to tasks and users
- Activity history across projects and tasks

## 12. Success Metrics

Success should be measured using operational and adoption indicators:

- Reduction in missed deadlines
- Reduction in overloaded team members
- Increased time logging compliance
- Faster project status reporting
- Higher task completion visibility
- Lower manual follow-up for project updates
- Improved sprint predictability

## 13. Risks and Dependencies

### Risks

- ERPNext integration complexity may delay the first usable release.
- The feature set is broad, so MVP scope control is essential.
- Mobile and desktop experiences may diverge without a strong design system.
- Analytics can become expensive if data quality is inconsistent.

### Dependencies

- Availability of ERPNext API endpoints or custom Frappe APIs
- Reliable authentication and role mapping
- Sample data or staging records for UI validation
- Agreement on MVP scope and reporting priorities

## 14. Recommended Delivery Phases

### Phase 1: Core Platform

- Authentication and role-based access
- Dashboard
- Projects
- Tasks
- Collaboration
- Time tracking
- Team directory
- ERPNext integration foundation

### Phase 2: Planning and Visibility

- Sprints
- Workload management
- Advanced filters and timeline views
- More detailed reporting
- Notifications

### Phase 3: Intelligence and Expansion

- AI summaries
- AI risk detection
- AI workload recommendations
- Client portal capabilities
- Offline-first task updates

## 15. Definition of Done for the Product Spec

This PRD is ready to guide implementation when:

- Core scope and phase boundaries are agreed
- Primary roles and permissions are confirmed
- ERPNext integration contract is defined
- Navigation and information architecture are accepted
- MVP analytics and reporting priorities are set

## 16. Summary

ADVBench is intended to become the internal operating system for project delivery across ERPNext consulting and custom development teams. The product combines project tracking, task execution, team coordination, and delivery analytics into a single responsive experience that is fast, structured, and easy to use.

The recommended product direction is to launch a focused MVP centered on dashboard visibility, projects, tasks, collaboration, time tracking, and ERPNext integration, then expand into sprint analytics, workload intelligence, AI assistance, and client-facing capabilities.
