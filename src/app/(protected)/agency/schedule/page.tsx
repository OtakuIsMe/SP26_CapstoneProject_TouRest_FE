"use client";

import { useState, useEffect } from "react";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import { mapAgencyScheduleToTourRun, TourRun } from "@/components/schedule/schedule.types";
import { agencyService } from "@/libs/services/agency.service";
import { useSubRole } from "@/hooks/useSubRole";

export default function AgencySchedulePage() {
    const [runs, setRuns] = useState<TourRun[]>([]);
    const [loading, setLoading] = useState(true);
    const { is: isRole, ready: roleReady } = useSubRole("agency");

    useEffect(() => {
        if (!roleReady) return;
        setLoading(true);
        const fetch = isRole("tour_guide")
            ? agencyService.getMyGuideSchedules()
            : agencyService.getAgencySchedules();

        fetch
            .then(res => { if (res?.data) setRuns(res.data.map(s => mapAgencyScheduleToTourRun(s))); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [roleReady, isRole]);

    const mode = isRole("tour_guide") ? "agency-guide" : "agency-manager";

    return (
        <ScheduleCalendar
            runs={runs}
            setRuns={setRuns}
            loading={loading}
            mode={mode}
        />
    );
}
