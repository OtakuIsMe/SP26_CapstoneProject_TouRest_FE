"use client";

import { useState, useEffect } from "react";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import { mapAgencyScheduleToTourRun, TourRun } from "@/components/schedule/schedule.types";
import { adminService } from "@/libs/services/admin.service";

export default function AdminSchedulePage() {
    const [runs, setRuns] = useState<TourRun[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        adminService.getAllSchedules()
            .then(res => {
                if (res?.data) {
                    setRuns(res.data.map(s =>
                        mapAgencyScheduleToTourRun(s, s.agencyName)
                    ));
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <ScheduleCalendar
            runs={runs}
            setRuns={setRuns}
            loading={loading}
            mode="admin"
        />
    );
}
