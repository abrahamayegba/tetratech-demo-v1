"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSites,
  getAssetInstances,
  getAssetTests,
  getNotifications,
  getReactiveJobs,
  getPermits,
} from "@/lib/store";
import type {
  Site,
  AssetInstance,
  AssetTest,
  Notification,
  ReactiveJob,
  Permit,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Package,
  XCircle,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Zap,
  HelpCircle,
  FileText,
  ClipboardCheck,
  CircleDashed,
} from "lucide-react";
import Link from "next/link";
import {
  formatDistanceToNow,
  isPast,
} from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";

const GREEN = "#16a34a";
const RED = "#dc2626";
const BLUE = "#2563eb";
const AMBER = "#d97706";

function getOctoberStatus(index: number) {
  if (index < 3) return "noTest" as const;
  if (index < 10) return "scheduled" as const;
  if (index % 7 === 0) return "fail" as const;
  return "pass" as const;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [instances, setInstances] = useState<AssetInstance[]>([]);
  const [tests, setTests] = useState<AssetTest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reactiveJobs, setReactiveJobs] = useState<ReactiveJob[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);

  useEffect(() => {
    setSites(getSites());
    setInstances(getAssetInstances());
    setTests(getAssetTests());
    setNotifications(getNotifications());
    setReactiveJobs(getReactiveJobs());
    setPermits(getPermits());
  }, []);

  const activeSites = sites.filter((s) => s.status === "active").length;
  const totalAssets = instances.length;
  const octoberStatuses = instances.map((instance) => ({
    instance,
    status:
      instance.lastTestResult === "pending"
        ? ("scheduled" as const)
        : instance.lastTestResult === "pass" || instance.lastTestResult === "fail"
          ? instance.lastTestResult
          : ("noTest" as const),
  }));
  const passedTests = octoberStatuses.filter((item) => item.status === "pass").length;
  const failedTests = octoberStatuses.filter((item) => item.status === "fail").length;
  const scheduledTests = octoberStatuses.filter((item) => item.status === "scheduled").length;
  const noTestAssets = octoberStatuses.filter((item) => item.status === "noTest").length;

  const overdueAssets = octoberStatuses.filter((item) => item.status === "noTest").length;

  const dueSoon = octoberStatuses.filter((item) => item.status === "scheduled").length;

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const openJobs = reactiveJobs.filter((j) => j.status === "open").length;
  const portalJobs = reactiveJobs.filter((j) => j.source === "portal").length;

  // Permits derived state
  const pendingPermits = permits.filter((p) => p.status === "pending");
  const approvedPermits = permits.filter((p) => p.status === "approved");
  const recentPermits = permits.slice(0, 5);

  // Live/active permits for today
  const todayStr = new Date().toISOString().split("T")[0];
  const livePermitsToday = permits.filter((p) => {
    if (p.status !== "approved") return false;
    return p.plannedStartDate <= todayStr && p.plannedEndDate >= todayStr;
  });

  // Keep the chart tied to the same asset records shown in Live Assets.
  const siteChartData = sites
    .filter((site) => site.status === "active")
    .map((site) => {
      const statusCounts = instances
        .filter((instance) => instance.siteId === site.id)
        .reduce(
          (counts: Record<"pass" | "fail" | "scheduled" | "noTest", number>, instance) => {
            const status =
              instance.lastTestResult === "pending"
                ? "scheduled"
                : instance.lastTestResult === "pass" || instance.lastTestResult === "fail"
                  ? instance.lastTestResult
                  : "noTest";
            counts[status] += 1;
            return counts;
          },
          { pass: 0, fail: 0, scheduled: 0, noTest: 0 },
        );
      const shortName = site.name
        .replace(
          / (Supported Living|Care Home|Day Centre|Resource Centre|Residential|Hub|Crown House)$/i,
          "",
        )
        .slice(0, 14);
      return { site: shortName, siteId: site.id, ...statusCounts };
    });

  const pieData = [
    { name: "Pass", value: passedTests },
    { name: "Fail", value: failedTests },
    { name: "Scheduled", value: scheduledTests },
    { name: "No Test", value: noTestAssets },
  ];

  // Deterministic year-to-date demo history. October uses the live October
  // totals above so the two dashboard views remain consistent.
  const yearToDateData = [
    { month: "Jan", pass: 38, fail: 1, scheduled: 3, noTest: 0 },
    { month: "Feb", pass: 41, fail: 1, scheduled: 2, noTest: 0 },
    { month: "Mar", pass: 44, fail: 2, scheduled: 2, noTest: 1 },
    { month: "Apr", pass: 46, fail: 1, scheduled: 3, noTest: 0 },
    { month: "May", pass: 49, fail: 1, scheduled: 3, noTest: 0 },
    { month: "Jun", pass: 51, fail: 2, scheduled: 2, noTest: 1 },
    { month: "Jul", pass: 53, fail: 1, scheduled: 3, noTest: 0 },
    { month: "Aug", pass: 55, fail: 2, scheduled: 2, noTest: 0 },
    { month: "Sep", pass: 57, fail: 1, scheduled: 2, noTest: 1 },
    {
      month: "Oct",
      pass: passedTests,
      fail: failedTests,
      scheduled: scheduledTests,
      noTest: noTestAssets,
    },
  ];

  // Recent notifications
  const recentNotifications = notifications.slice(0, 4);

  // Assets needing attention
  const assetsNeedingAttention = instances
    .filter(
      (i) =>
        i.lastTestResult === "fail" ||
        (i.nextTestDue && isPast(new Date(i.nextTestDue))),
    )
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground text-balance">
          Good {getTimeOfDay()}, {user?.name.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s an overview of TetraTech&apos;s asset compliance status.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Active Sites"
          value={activeSites}
          icon={Building2}
          color="purple"
          href="/sites"
          sub={`${sites.length} total`}
        />
        <KpiCard
          title="Managed Assets"
          value={totalAssets}
          icon={Package}
          color="purple"
          href="/assets"
          sub="across all sites"
        />
        <KpiCard
          title="Assets - Passed"
          value={passedTests}
          icon={CheckCircle2}
          color="green"
          href="/tests"
          sub={`${tests.length} total tests`}
        />
        <KpiCard
          title="Assets - Failed"
          value={failedTests}
          icon={XCircle}
          color="red"
          href="/tests"
          sub="require action"
        />
        <KpiCard
          title="Assets — No Tests"
          value={noTestAssets}
          icon={HelpCircle}
          color="amber"
          href="/assets"
          sub="no test on record"
        />
      </div>

      {/* Status Alerts */}
      {(overdueAssets > 0 || dueSoon > 0) && (
        <div className="flex flex-col gap-2">
          {overdueAssets > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-800 font-medium">
                {overdueAssets} asset{overdueAssets > 1 ? "s are" : " is"}{" "}
                overdue for testing.
              </p>
              <Link
                href="/assets"
                className="ml-auto text-xs text-red-700 hover:underline flex items-center gap-1"
              >
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          {dueSoon > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                {dueSoon} asset{dueSoon > 1 ? "s" : ""} due for testing within
                the next 30 days.
              </p>
              <Link
                href="/assets"
                className="ml-auto text-xs text-amber-700 hover:underline flex items-center gap-1"
              >
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Charts + Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Combo bar chart: tests by site */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              October Asset Test Status by Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={siteChartData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                layout="vertical"
                onClick={(event) => {
                  const siteId = event?.activePayload?.[0]?.payload?.siteId;
                  if (siteId) router.push(`/assets?site=${siteId}`);
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="site"
                  tick={{ fontSize: 10 }}
                  width={110}
                  interval={0}
                />
                <Tooltip />
                <Legend
                  iconSize={10}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Bar
                  dataKey="pass"
                  stackId="a"
                  fill={GREEN}
                  name="Pass"
                  radius={[0, 0, 0, 0]}
                />
                <Bar dataKey="fail" stackId="a" fill={RED} name="Fail" />
                <Bar dataKey="scheduled" stackId="a" fill={BLUE} name="Scheduled" />
                <Bar
                  dataKey="noTest"
                  stackId="a"
                  fill={AMBER}
                  name="No Test"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              October Test Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ value }) => value}
                  labelLine={false}
                >
                  <Cell fill={GREEN} />
                  <Cell fill={RED} />
                  <Cell fill={BLUE} />
                  <Cell fill={AMBER} />
                </Pie>

                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full-width year-to-date history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Year-to-Date Asset Test Status
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Monthly test activity across all sites for 2026. October matches the live October status totals above.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={yearToDateData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
  <Bar dataKey="pass" stackId="year" fill={GREEN} name="Pass">
    <LabelList dataKey="pass" position="center" fill="#ffffff" fontSize={10} formatter={(value) => (value ? value : "")} />
  </Bar>
  <Bar dataKey="fail" stackId="year" fill={RED} name="Fail">
    <LabelList dataKey="fail" position="center" fill="#ffffff" fontSize={10} formatter={(value) => (value ? value : "")} />
  </Bar>
  <Bar dataKey="scheduled" stackId="year" fill={BLUE} name="Scheduled">
    <LabelList dataKey="scheduled" position="center" fill="#ffffff" fontSize={10} formatter={(value) => (value ? value : "")} />
  </Bar>
  <Bar dataKey="noTest" stackId="year" fill={AMBER} name="No Test" radius={[4, 4, 0, 0]}>
    <LabelList dataKey="noTest" position="center" fill="#ffffff" fontSize={10} formatter={(value) => (value ? value : "")} />
  </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Reactive jobs strip */}
      {openJobs > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--brand-purple)]" />
              Open Reactive Jobs
              {portalJobs > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  · {portalJobs} submitted via portal
                </span>
              )}
            </CardTitle>
            <Link href="/reactive-jobs">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-[var(--brand-purple)]"
              >
                Manage <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {reactiveJobs
              .filter((j) => j.status === "open")
              .slice(0, 4)
              .map((job) => {
                const site = sites.find((s) => s.id === job.siteId);
                const priorityColors: Record<string, string> = {
                  urgent: "border-red-200 text-red-700 bg-red-50",
                  high: "border-orange-200 text-orange-700 bg-orange-50",
                  medium: "border-yellow-200 text-yellow-700 bg-yellow-50",
                  low: "border-blue-200 text-blue-700 bg-blue-50",
                };
                return (
                  <Link href="/reactive-jobs" key={job.id}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <Zap className="w-4 h-4 text-[var(--brand-purple)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {job.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {site?.name}
                        </p>
                      </div>
                      {job.source === "portal" && (
                        <span className="text-[10px] text-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-1.5 py-0.5 rounded font-medium shrink-0">
                          Portal
                        </span>
                      )}
                      <span
                        className={`text-[10px] border px-1.5 py-0.5 rounded font-medium shrink-0 ${priorityColors[job.priority]}`}
                      >
                        {job.priority.charAt(0).toUpperCase() +
                          job.priority.slice(1)}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Live Permits Today */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--brand-purple)]" />
            Active Permits on Site Today
            {livePermitsToday.length > 0 && (
              <Badge className="bg-green-600 text-white border-0 text-[10px] px-1.5">
                {livePermitsToday.length} live
              </Badge>
            )}
            {pendingPermits.length > 0 && (
              <Badge className="bg-amber-500 text-white border-0 text-[10px] px-1.5">
                {pendingPermits.length} pending
              </Badge>
            )}
          </CardTitle>
          <Link href="/permits">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-[var(--brand-purple)]"
            >
              Manage <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {livePermitsToday.length === 0 ? (
            <div className="flex items-center gap-2.5 py-3 px-3 rounded-lg bg-muted/30 border border-border/60">
              <ClipboardCheck className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  No active permits on site today
                </p>
                {pendingPermits.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {pendingPermits.length} permit
                    {pendingPermits.length !== 1 ? "s" : ""} awaiting approval
                  </p>
                )}
              </div>
            </div>
          ) : (
            livePermitsToday.map((permit) => {
              const site = sites.find((s) => s.id === permit.siteId);
              return (
                <Link href="/permits" key={permit.id}>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-green-200/60 bg-green-50/40 hover:bg-green-50 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-foreground">
                        {permit.contractorCompany}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {site?.name} &middot; {permit.locationOnSite}
                      </p>
                    </div>
                    <span className="text-[10px] border border-green-200 px-1.5 py-0.5 rounded font-medium shrink-0 bg-green-50 text-green-700">
                      Active
                    </span>
                  </div>
                </Link>
              );
            })
          )}
          {pendingPermits.length > 0 && livePermitsToday.length > 0 && (
            <Link href="/permits">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-amber-200/60 bg-amber-50/40 hover:bg-amber-50 transition-colors mt-1">
                <CircleDashed className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 flex-1">
                  {pendingPermits.length} permit
                  {pendingPermits.length !== 1 ? "s" : ""} awaiting approval
                </p>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assets needing attention */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Assets Needing Attention
            </CardTitle>
            <Link href="/assets">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-[var(--brand-purple)]"
              >
                View all <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {assetsNeedingAttention.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                All assets are up to date.
              </div>
            ) : (
              assetsNeedingAttention.map((asset) => {
                const isOverdue =
                  asset.nextTestDue && isPast(new Date(asset.nextTestDue));
                return (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/60 bg-muted/20"
                  >
                    {asset.lastTestResult === "fail" ? (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {asset.serialNumber}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {asset.location}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        asset.lastTestResult === "fail"
                          ? "border-red-200 text-red-700 bg-red-50 text-[10px]"
                          : "border-amber-200 text-amber-700 bg-amber-50 text-[10px]"
                      }
                    >
                      {asset.lastTestResult === "fail" ? "Failed" : "Overdue"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent notifications */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Recent Notifications
              {unreadNotifications > 0 && (
                <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5">
                  {unreadNotifications}
                </Badge>
              )}
            </CardTitle>
            <Link href="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-[var(--brand-purple)]"
              >
                View all <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg border ${n.read ? "border-border/40 bg-transparent" : "border-[var(--brand-purple)]/20 bg-accent/30"}`}
              >
                <NotificationIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-purple)] mt-1 shrink-0" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  href,
  sub,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: "purple" | "green" | "red" | "amber";
  href: string;
  sub: string;
}) {
  const colorMap = {
    purple: "bg-[var(--brand-purple)]/10 text-[var(--brand-purple)]",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="flex flex-col gap-3 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}
            >
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "test_failed")
    return <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
  if (type === "test_passed")
    return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
  if (type === "test_overdue")
    return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
  if (type === "supplier_insurance_expired")
    return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
  return (
    <Bell className="w-4 h-4 text-[var(--brand-purple)] shrink-0 mt-0.5" />
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
