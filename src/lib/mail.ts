import nodemailer from "nodemailer";
import { TaskPriority } from "@prisma/client";

// ─── Transporter ─────────────────────────────────────────────────────────────
// Created lazily so the import never crashes if env vars are missing at build time.
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function formatPriority(priority: TaskPriority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase(); // "HIGH" → "High"
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
      return "#6b7280";
  }
}

function formatDate(date?: Date | string | null): string {
  if (!date) return "Not specified";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Base layout ─────────────────────────────────────────────────────────────
function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TaskFlow Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#1d4ed8;border-radius:10px;padding:8px 10px;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;">&#10003;</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">TaskFlow</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="color:#52525b;font-size:12px;margin:0;">
                You received this email because you are registered on TaskFlow.<br/>
                &copy; ${new Date().getFullYear()} TaskFlow. All rights reserved.
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
    <td style="padding-top:28px;text-align:center;">
      <a href="${url}"
         style="display:inline-block;background:#1d4ed8;color:#fff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:10px;letter-spacing:0.2px;">
        ${label}
      </a>
    </td>
  </tr>`;
}

function taskRow(label: string, value: string, valueStyle = ""): string {
  return `<tr>
    <td style="padding:6px 0;border-bottom:1px solid #27272a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="38%" style="color:#71717a;font-size:13px;padding:8px 0;">${label}</td>
          <td style="color:${valueStyle || "#e4e4e7"};font-size:13px;font-weight:500;padding:8px 0;">${value}</td>
        </tr>
      </table>
    </td>
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
    console.warn(
      "[mail] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping task-created email."
    );
    return { sent: false, error: "Email not configured" };
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

  const body = `
    <tr><td>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;">Hi <strong style="color:#fff;">${displayName}</strong>,</p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 4px;line-height:1.3;">
        You have a new task
      </h1>
      <p style="color:#71717a;font-size:13px;margin:0 0 28px;">
        <strong style="color:#a1a1aa;">${creatorName || "A team member"}</strong> assigned a task to you.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border:1px solid #27272a;border-radius:10px;padding:4px 16px;margin-bottom:8px;">
        ${taskRow("Task", taskTitle)}
        ${taskRow("Description", taskDescription || "<em style='color:#52525b'>No description provided</em>")}
        ${taskRow("Priority", `<span style="color:${pColor};font-weight:600;">${formatPriority(taskPriority)}</span>`, pColor)}
        ${taskRow("Due Date", formatDate(taskDueDate))}
        ${taskRow("Assigned by", creatorName || "Unknown")}
        ${taskRow("Status", "<span style='color:#f59e0b;font-weight:600;'>Pending</span>")}
      </table>
    </td></tr>
    ${ctaButton("Open TaskFlow &rarr;", dashboardUrl)}
  `;

  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.GMAIL_USER}>`,
      to: assignedUserEmail,
      subject: `New Task Assigned — ${taskTitle}`,
      html: wrapHtml(body),
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
    console.warn(
      "[mail] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping task-completed email."
    );
    return { sent: false, error: "Email not configured" };
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
  const completedAt = formatDate(new Date());

  const body = `
    <tr><td>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;">Hi <strong style="color:#fff;">${displayName}</strong>,</p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 4px;line-height:1.3;">
        &#10003;&nbsp; Task completed
      </h1>
      <p style="color:#71717a;font-size:13px;margin:0 0 28px;">
        One of your tasks has been marked as <strong style="color:#22c55e;">Completed</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border:1px solid #27272a;border-radius:10px;padding:4px 16px;margin-bottom:8px;">
        ${taskRow("Task", taskTitle)}
        ${taskRow("Priority", `<span style="color:${pColor};font-weight:600;">${formatPriority(taskPriority)}</span>`, pColor)}
        ${taskRow("Completed by", completedByName || "Unknown")}
        ${taskRow("Completed at", completedAt)}
        ${taskRow("Status", "<span style='color:#22c55e;font-weight:600;'>&#10003; Completed</span>")}
      </table>
    </td></tr>
    ${ctaButton("Open TaskFlow &rarr;", dashboardUrl)}
  `;

  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.GMAIL_USER}>`,
      to: creatorEmail,
      subject: `Task Completed — ${taskTitle}`,
      html: wrapHtml(body),
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mail] Failed to send task-completed email:", message);
    return { sent: false, error: "Email delivery failed" };
  }
}
