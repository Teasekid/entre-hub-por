
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  student_name: string;
  student_email: string;
  skill_applied: string;
  status: 'accepted' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_name, student_email, skill_applied, status }: EmailRequest = await req.json();

    const skillFormatted = skill_applied.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    const isAccepted = status === 'accepted';
    const subject = `Application ${isAccepted ? 'Approved' : 'Rejected'} - ${skillFormatted}`;
    
    const emailContent = isAccepted 
      ? `
        <h1>Congratulations, ${student_name}!</h1>
        <p>Your application for <strong>${skillFormatted}</strong> has been <strong>approved</strong>.</p>
        <p>You will be contacted soon with further details about the program schedule and requirements.</p>
        <p>Best regards,<br>Federal University of Lafia<br>Entrepreneurship Department</p>
      `
      : `
        <h1>Application Update</h1>
        <p>Dear ${student_name},</p>
        <p>Thank you for your interest in our <strong>${skillFormatted}</strong> program.</p>
        <p>Unfortunately, your application was not successful at this time. We encourage you to apply for other programs or reapply in the future.</p>
        <p>Best regards,<br>Federal University of Lafia<br>Entrepreneurship Department</p>
      `;

    const emailResponse = await resend.emails.send({
      from: "FULafia Entrepreneurship <onboarding@resend.dev>",
      to: [student_email],
      subject: subject,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
