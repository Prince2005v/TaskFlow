import nodemailer from "nodemailer";
import { TaskPriority } from "@prisma/client";

// ─── Transporter ─────────────────────────────────────────────────────────────
// Created lazily so the import never crashes if env vars are missing or during build.
function createTransporter() {
  const user = process.env.GMAIL_USER?.trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!user || !rawPass) {
    return null;
  }

  // Google app passwords can be copied with or without spaces
  const pass = rawPass.replace(/\s+/g, "");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

// ─── Shared formatting helpers ────────────────────────────────────────────────
function formatPriority(priority: TaskPriority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function priorityColor(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.HIGH:
      return "#ef4444"; // red
    case TaskPriority.MEDIUM:
      return "#f59e0b"; // amber
    case TaskPriority.LOW:
      return "#38bdf8"; // sky
    default:
      return "#9ca3af";
  }
}

function formatDate(date?: Date | string | null): string {
  if (!date) return "Not specified";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date?: Date | string | null): string {
  if (!date) return "Just now";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Base layout template ───────────────────────────────────────────────────
function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;">
          <!-- Brand Header -->
          <tr>
            <td style="padding-bottom:20px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#2563eb;border-radius:8px;padding:6px 9px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:16px;font-weight:bold;line-height:1;">&#10003;</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.2px;">TaskFlow</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:14px;padding:28px 24px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="color:#71717a;font-size:12px;margin:0;line-height:1.5;">
                TaskFlow &bull; Automated Team Workflow System<br/>
                You are receiving this because you are an active member on TaskFlow.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
  return `<tr>
    <td style="padding-top:24px;text-align:center;">
      <a href="${url}"
         style="display:inline-block;background:#2563eb;color:#ffffff;font-size:13px;font-weight:600;
                text-decoration:none;padding:11px 26px;border-radius:8px;letter-spacing:0.1px;">
        ${label} &rarr;
      </a>
    </td>
  </tr>`;
}

function detailRow(label: string, value: string, isLast = false): string {
  const borderBottom = isLast ? "" : "border-bottom:1px solid #27272a;";
  return `<tr>
    <td style="padding:9px 12px;${borderBottom}color:#a1a1aa;font-size:13px;width:34%;">${label}</td>
    <td style="padding:9px 12px;${borderBottom}color:#f4f4f5;font-size:13px;font-weight:500;">${value}</td>
  </tr>`;
}

// ─── sendTaskCreatedEmail ─────────────────────────────────────────────────────
export interface TaskCreatedEmailParams {
  assignedUserEmail: string;
  assignedUserName: string | null;
  creatorName: string | null;
  taskTitle: string;
  taskDescription: string | null;
  taskPriority: TaskPriority;
  taskDueDate: Date | string | null;
  dashboardUrl?: string;
}

export async function sendTaskCreatedEmail(
  params: TaskCreatedEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[mail] GMAIL_USER or GMAIL_APP_PASSWORD not configured — skipping notification.");
    return { sent: false, error: "Email service not configured" };
  }

  const {
    assignedUserEmail,
    assignedUserName,
    creatorName,
    taskTitle,
    taskDescription,
    taskPriority,
    taskDueDate,
    dashboardUrl = "http://localhost:3000/dashboard",
  } = params;

  const displayName = assignedUserName || assignedUserEmail.split("@")[0];
  const pColor = priorityColor(taskPriority);
  const pBadge = `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:${pColor}20;color:${pColor};font-weight:600;font-size:12px;">${formatPriority(taskPriority)}</span>`;

  const body = `
    <tr><td>
      <div style="display:inline-block;background:#2563eb15;border:1px solid #2563eb30;color:#60a5fa;font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
        New Assignment
      </div>
      <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;line-height:1.25;">
        ${taskTitle}
      </h1>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;line-height:1.4;">
        Hi <strong style="color:#ffffff;">${displayName}</strong>, <strong style="color:#e4e4e7;">${creatorName || "A team member"}</strong> has assigned this task to you.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:#09090b;border:1px solid #27272a;border-radius:10px;margin-bottom:6px;border-collapse:collapse;">
        ${detailRow("Assigned to", displayName)}
        ${detailRow("Assigned by", creatorName || "Team Member")}
        ${detailRow("Priority", pBadge)}
        ${detailRow("Due Date", formatDate(taskDueDate))}
        ${detailRow("Status", "<span style='color:#f59e0b;font-weight:600;'>Pending</span>")}
        ${detailRow("Description", taskDescription ? taskDescription.replace(/\n/g, "<br/>") : "<em style='color:#71717a;'>No description provided</em>", true)}
      </table>
    </td></tr>
    ${ctaButton("View Task on TaskFlow", dashboardUrl)}
  `;

  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.GMAIL_USER}>`,
      to: assignedUserEmail,
      subject: `[TaskFlow] New Task Assigned: ${taskTitle}`,
      html: wrapHtml(`TaskFlow: ${taskTitle}`, body),
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mail] Failed to send task-created email:", message);
    return { sent: false, error: "Email delivery failed" };
  }
}

// ─── sendTaskCompletedEmail ───────────────────────────────────────────────────
export interface TaskCompletedEmailParams {
  creatorEmail: string;
  creatorName: string | null;
  completedByName: string | null;
  taskTitle: string;
  taskPriority: TaskPriority;
  dashboardUrl?: string;
}

export async function sendTaskCompletedEmail(
  params: TaskCompletedEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[mail] GMAIL_USER or GMAIL_APP_PASSWORD not configured — skipping notification.");
    return { sent: false, error: "Email service not configured" };
  }

  const {
    creatorEmail,
    creatorName,
    completedByName,
    taskTitle,
    taskPriority,
    dashboardUrl = "http://localhost:3000/dashboard",
  } = params;

  const displayName = creatorName || creatorEmail.split("@")[0];
  const pColor = priorityColor(taskPriority);
  const pBadge = `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:${pColor}20;color:${pColor};font-weight:600;font-size:12px;">${formatPriority(taskPriority)}</span>`;
  const completionTime = formatDateTime(new Date());

  const body = `
    <tr><td>
      <div style="display:inline-block;background:#10b98115;border:1px solid #10b98130;color:#34d399;font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
        &#10003;&nbsp; Completed
      </div>
      <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;line-height:1.25;">
        ${taskTitle}
      </h1>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;line-height:1.4;">
        Hi <strong style="color:#ffffff;">${displayName}</strong>, a task you created has been marked as completed.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:#09090b;border:1px solid #27272a;border-radius:10px;margin-bottom:6px;border-collapse:collapse;">
        ${detailRow("Task", taskTitle)}
        ${detailRow("Completed by", completedByName || "A team member")}
        ${detailRow("Completed at", completionTime)}
        ${detailRow("Priority", pBadge)}
        ${detailRow("Status", "<span style='color:#10b981;font-weight:600;'>&#10003; Completed</span>", true)}
      </table>
    </td></tr>
    ${ctaButton("Open TaskFlow Dashboard", dashboardUrl)}
  `;

  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.GMAIL_USER}>`,
      to: creatorEmail,
      subject: `[TaskFlow] Task Completed: ${taskTitle}`,
      html: wrapHtml(`Task Completed: ${taskTitle}`, body),
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mail] Failed to send task-completed email:", message);
    return { sent: false, error: "Email delivery failed" };
  }
}
