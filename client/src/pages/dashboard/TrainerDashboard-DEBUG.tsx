// TEMPORARY DEBUG VERSION - Check if this renders
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TrainerDashboard() {
    const [test, setTest] = useState("initial");

    console.log("🔥 TrainerDashboard RENDERING", { test });

    return (
        <DashboardLayout>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">DEBUG TRAINER PORTAL</h1>
                <p className="mb-4">Test state: {test}</p>

                <Button
                    onClick={() => {
                        console.log("🔥 BUTTON CLICKED!");
                        setTest("clicked at " + new Date().toISOString());
                        alert("Button works!");
                    }}
                    className="px-6 py-3 text-lg"
                >
                    TEST CLICK ME
                </Button>

                <div className="mt-4 p-4 border rounded">
                    <p>localStorage userId: {localStorage.getItem('userId')}</p>
                    <p>localStorage role: {localStorage.getItem('userRole')}</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
