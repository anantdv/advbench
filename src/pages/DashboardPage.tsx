import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../lib/erpnext';
import { Topbar } from '../components/layout/Topbar';
import { MetricGrid } from '../components/dashboard/MetricGrid';
import { SectionFrame } from '../components/dashboard/SectionFrame';

const pageContent = {
  title: 'Executive Dashboard',
  description: 'A concise view of delivery health, workload, and what needs attention next.',
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const payload = data;

  return (
    <>
      <Topbar title={pageContent.title} description={pageContent.description} />

      {isLoading ? <p className="loading-state">Loading dashboard snapshot...</p> : null}

      {payload ? (
        <>
          <MetricGrid metrics={payload.summary} />

          <section className="dashboard-stack">
            <SectionFrame kicker="Projects" title="Live ERPNext projects" className="panel-large">
              <div className="table">
                {payload.projects.length > 0 ? (
                  payload.projects.slice(0, 20).map((project) => (
                    <div key={project.code} className="table-row">
                      <div>
                        <strong>{project.name}</strong>
                        <span>
                          {project.code} · {project.client}
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
                        <small>{project.dueDate}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-copy">No project records were returned from ERPNext.</p>
                )}
              </div>
            </SectionFrame>

            <SectionFrame kicker="Tasks" title="Live ERPNext tasks" className="panel-large">
              <div className="task-list">
                {payload.tasks.length > 0 ? (
                  payload.tasks.slice(0, 20).map((task) => (
                    <div key={task.id} className="task-card">
                      <div className="task-card-header">
                        <div>
                          <strong>{task.title}</strong>
                          <span>
                            {task.id} · {task.project}
                          </span>
                        </div>
                        <span className={`pill ${task.priority.toLowerCase()}`}>{task.status}</span>
                      </div>
                      <div className="task-meta">
                        <span>{task.assignee}</span>
                        <span>Due {task.dueDate}</span>
                        <span>{task.estimate}h estimate</span>
                        <span>{task.actual}h logged</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-copy">No task records were returned from ERPNext.</p>
                )}
              </div>
            </SectionFrame>
          </section>

          <section className="dashboard-stack">
            <SectionFrame kicker="Workspace Pulse" title="Team and activity">
              <div className="detail-stack">
                <div>
                  <p className="panel-kicker">Team</p>
                  <div className="team-list">
                    {payload.team.length > 0 ? (
                      payload.team.map((member) => (
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
                      ))
                    ) : (
                      <p className="empty-copy">No team snapshot is available yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="panel-kicker">Activity</p>
                  <div className="activity-feed">
                    {payload.activity.length > 0 ? (
                      payload.activity.map((item) => (
                        <div key={`${item.title}-${item.time}`} className="activity-item">
                          <strong>{item.title}</strong>
                          <span>{item.time}</span>
                          <small>{item.detail}</small>
                        </div>
                      ))
                    ) : (
                      <p className="empty-copy">No recent activity yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </SectionFrame>
          </section>
        </>
      ) : null}
    </>
  );
}
