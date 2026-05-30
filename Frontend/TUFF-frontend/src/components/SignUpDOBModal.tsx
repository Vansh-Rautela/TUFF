import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SignUpUsernameModal from "./SignUpUsernameModal";

const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
];
const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

export default function SignUpDOBModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(7); // August (0-indexed)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const maxDay = daysInMonth(selectedYear, selectedMonth);
  if (selectedDay > maxDay) setSelectedDay(maxDay);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-xl p-0 overflow-visible">
          <div className="bg-white rounded-xl shadow-lg p-0">
            <div className="p-6 pb-2">
              <div className="text-xs text-rose-500 font-semibold mb-2">Step 2 of 5</div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-bold mb-1">Hey Ashwin. What's your date of birth?</DialogTitle>
                <DialogDescription className="text-neutral-600 mb-2">
                  We need this to keep TUFF a safe space. We won’t show it on your profile.
                </DialogDescription>
                <div className="text-xs text-rose-500 mb-2">Why do I need to give my date of birth?</div>
              </DialogHeader>
              <div className="mt-6 mb-2 text-sm font-medium">Date of birth</div>
              <div className="flex justify-center mb-2">
                <div className="flex gap-4">
                  {/* Day Picker */}
                  <select className="text-lg px-2 py-1 rounded bg-neutral-100" value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}>
                    {Array.from({ length: maxDay }, (_, i) => i + 1).map(day => (
                      <option value={day} key={day}>{day.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  {/* Month Picker */}
                  <select className="text-lg px-2 py-1 rounded bg-neutral-100" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                    {months.map((m, idx) => (
                      <option value={idx} key={m}>{m}</option>
                    ))}
                  </select>
                  {/* Year Picker */}
                  <select className="text-lg px-2 py-1 rounded bg-neutral-100" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                    {years.map(y => (
                      <option value={y} key={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button className="w-full mt-6 mb-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2" onClick={() => setShowUsernameModal(true)}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SignUpUsernameModal open={showUsernameModal} onOpenChange={setShowUsernameModal} />
    </>
  );
}
