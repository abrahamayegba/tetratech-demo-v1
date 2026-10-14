"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, ClipboardCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ratings = ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"];

export default function ScorecardPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-full bg-muted/20 p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-purple)]">Monthly review</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Performance scorecard</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Tell us how satisfied you are with the service and performance delivered this month.</p>
        </div>

        {submitted ? (
          <Card className="border-green-200 bg-green-50/70">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="size-10 text-green-600" />
              <h2 className="text-lg font-semibold text-green-950">Thank you for your feedback</h2>
              <p className="max-w-md text-sm text-green-800">Your monthly scorecard has been submitted to the TetraTech team.</p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>Submit another response</Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4 text-[var(--brand-purple)]" />Review details</CardTitle>
                <CardDescription>Identify the site and month this scorecard covers.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2"><Label htmlFor="site">Site or location</Label><Input id="site" required placeholder="e.g. Bristol" /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="month">Review month</Label><Input id="month" type="month" required defaultValue="2026-10" /></div>
                <div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor="reviewer">Your name</Label><Input id="reviewer" required placeholder="Enter your name" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Satisfaction</CardTitle><CardDescription>Select the response that best reflects this month&apos;s performance.</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-5">
                {["Overall service performance", "Responsiveness to reactive jobs", "Quality of planned maintenance", "Communication and updates"].map((question, index) => (
                  <fieldset key={question} className="flex flex-col gap-2">
                    <legend className="text-sm font-medium">{question}</legend>
                    <div className="grid gap-2 sm:grid-cols-5">
                      {ratings.map((rating) => <label key={rating} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground has-[:checked]:border-[var(--brand-purple)] has-[:checked]:bg-[var(--brand-purple)]/5 has-[:checked]:text-foreground"><input type="radio" name={`rating-${index}`} value={rating} required className="accent-[var(--brand-purple)]" />{rating}</label>)}
                    </div>
                  </fieldset>
                ))}
                <div className="flex flex-col gap-2"><Label htmlFor="comments">Additional comments</Label><Textarea id="comments" placeholder="What went well, and what could we improve?" rows={5} /></div>
              </CardContent>
            </Card>
            <div className="flex justify-end"><Button type="submit" className="gap-2"><Send className="size-4" />Submit scorecard</Button></div>
          </form>
        )}
      </div>
    </main>
  );
}
