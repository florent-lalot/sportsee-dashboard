import { NextResponse } from "next/server";
import { validateTrainingPlan } from "@/prompts/trainingPlanPrompts";

const DAY_INDEX = {
  Lundi: 0,
  Mardi: 1,
  Mercredi: 2,
  Jeudi: 3,
  Vendredi: 4,
  Samedi: 5,
  Dimanche: 6,
};

function escapeIcs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .slice(0, 500);
}

function foldLine(line) {
  if (line.length <= 73) return line;
  return line.match(/.{1,73}/g).join("\r\n ");
}

function localIcsDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00`;
}

function utcIcsDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function getSessionDate(startDate, weekNumber, day) {
  // UTC is used only for calendar arithmetic. DTSTART is explicitly emitted
  // in Europe/Paris below, so every session remains at 18:00 local time.
  const date = new Date(`${startDate}T18:00:00Z`);
  const startDay = (date.getUTCDay() + 6) % 7;
  const offset = (DAY_INDEX[day] - startDay + 7) % 7;
  date.setUTCDate(date.getUTCDate() + (weekNumber - 1) * 7 + offset);
  return date;
}

function buildIcs(plan, startDate) {
  const generatedAt = new Date();
  const events = plan.weeks.flatMap((week) =>
    week.sessions.map((session, index) => {
      const startsAt = getSessionDate(startDate, week.weekNumber, session.day);
      const endsAt = new Date(startsAt.getTime() + session.durationMin * 60_000);
      const description = [
        `Type : ${session.type}`,
        `Intensite : ${session.intensity}`,
        `Duree : ${session.durationMin} minutes`,
        session.distanceKm !== null && session.distanceKm !== undefined ? `Distance : ${session.distanceKm} km` : null,
        session.instructions,
      ].filter(Boolean).join("\n");

      return [
        "BEGIN:VEVENT",
        `UID:sportsee-${week.weekNumber}-${index}-${generatedAt.getTime()}@sportsee.app`,
        `DTSTAMP:${utcIcsDate(generatedAt)}`,
        `DTSTART;TZID=Europe/Paris:${localIcsDate(startsAt)}`,
        `DTEND;TZID=Europe/Paris:${localIcsDate(endsAt)}`,
        `SUMMARY:${escapeIcs(`SportSee - ${session.type}`)}`,
        `DESCRIPTION:${escapeIcs(description)}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT30M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Rappel SportSee : seance dans 30 minutes",
        "END:VALARM",
        "END:VEVENT",
      ];
    }),
  ).flat();

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SportSee//Training Plan//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SportSee - Plan d'entrainement",
    "X-WR-TIMEZONE:Europe/Paris",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Paris",
    "X-LIC-LOCATION:Europe/Paris",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
  ].map(foldLine).join("\r\n");
}

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Le corps de la requete doit etre au format JSON." }, { status: 415 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Le JSON envoye est invalide." }, { status: 400 });
  }

  const plan = body?.plan;
  const availableDays = [...new Set(plan?.weeks?.flatMap((week) => week.sessions?.map((session) => session.day) ?? []) ?? [])];
  const validation = validateTrainingPlan(plan, availableDays, plan?.durationWeeks);
  if (!validation.valid || !isValidDate(body?.startDate)) {
    return NextResponse.json({ error: "Le plan ou la date de debut est invalide." }, { status: 400 });
  }

  const ics = buildIcs(plan, body.startDate);
  const fileDate = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const fileName = `sportsee-plan-${fileDate}-${Date.now()}.ics`;

  console.info("[api/training-plan/calendar] ICS generated", {
    weeks: plan.durationWeeks,
    sessions: plan.weeks.reduce((total, week) => total + week.sessions.length, 0),
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
