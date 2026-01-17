/**
 * HTTP Routes
 *
 * Defines HTTP endpoints for the application.
 * Uses Convex's httpRouter for handling HTTP requests.
 *
 * @module http
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Unsubscribe endpoint for one-click email unsubscribe.
 *
 * Route: GET /api/unsubscribe?token=<token>
 *
 * Validates the token and deactivates the subscription.
 * Returns an HTML confirmation page on success.
 * Returns a generic message for invalid tokens (no info leak).
 */
http.route({
  path: "/api/unsubscribe",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    // Validate token presence
    if (!token) {
      return new Response(
        generateHtmlPage(
          "Invalid Request",
          "No unsubscribe token provided.",
          false
        ),
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    try {
      // Attempt to deactivate the subscription
      const result = await ctx.runMutation(internal.alertNotifications.deactivateByToken, {
        token,
      });

      if (result.success) {
        const message =
          result.reason === "already_unsubscribed"
            ? "You have already been unsubscribed from these alerts."
            : "You have been successfully unsubscribed from these alerts.";

        return new Response(
          generateHtmlPage("Unsubscribed", message, true),
          {
            status: 200,
            headers: { "Content-Type": "text/html" },
          }
        );
      } else {
        // Invalid token - return generic message without revealing details
        return new Response(
          generateHtmlPage(
            "Unable to Process",
            "We were unable to process your unsubscribe request. The link may have expired or already been used.",
            false
          ),
          {
            status: 200, // Use 200 to not reveal token validity via status code
            headers: { "Content-Type": "text/html" },
          }
        );
      }
    } catch (error) {
      console.error("[ERROR] Unsubscribe handler error:", error);

      // Return generic error without exposing internal details
      return new Response(
        generateHtmlPage(
          "Error",
          "An unexpected error occurred. Please try again later.",
          false
        ),
        {
          status: 500,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  }),
});

/**
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

/**
 * Generates an HTML page for unsubscribe responses.
 * All dynamic content is escaped to prevent XSS attacks.
 *
 * @param title - Page title
 * @param message - Message to display
 * @param success - Whether the operation was successful
 * @returns HTML string
 */
export function generateHtmlPage(title: string, message: string, success: boolean): string {
  // Escape all dynamic content to prevent XSS
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const iconColor = success ? "#10b981" : "#ef4444";
  const icon = success
    ? `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
         <polyline points="22 4 12 14.01 9 11.01"></polyline>
       </svg>`
    : `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
         <circle cx="12" cy="12" r="10"></circle>
         <line x1="12" y1="8" x2="12" y2="12"></line>
         <line x1="12" y1="16" x2="12.01" y2="16"></line>
       </svg>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safeTitle} - GameStatus</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          background-color: #0f0f1a;
          color: #ffffff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background-color: #1a1a2e;
          border-radius: 16px;
          padding: 48px;
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        .icon {
          margin-bottom: 24px;
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          color: ${iconColor};
        }
        p {
          color: #a0a0a0;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .back-link {
          display: inline-block;
          background-color: #6366f1;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .back-link:hover {
          background-color: #5457e5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${icon}</div>
        <h1>${safeTitle}</h1>
        <p>${safeMessage}</p>
        <a href="/" class="back-link">Go to Dashboard</a>
      </div>
    </body>
    </html>
  `;
}

export default http;
