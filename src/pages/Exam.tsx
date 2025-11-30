// ... existing imports

// ... existing component code ...

  // 3. Event Listeners (Tab change, Copy/Paste, Fullscreen exit)
  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("tab_switch", "Tab switching is strictly prohibited.");
      }
    };

    const handleFullScreenChange = () => {
      // IMMEDIATE TERMINATION LOGIC
      if (!document.fullscreenElement && !isSubmitting) {
        // Log the specific violation before submitting if needed, or just pass the reason
        submitExam("Terminated: Exited Full Screen Mode");
      }
    };

    const preventCopyPaste = (e: Event) => {
      e.preventDefault();
      handleViolation("copy_paste", "Copy/Paste functionality is disabled.");
    };

    const preventContextMenu = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    window.addEventListener("copy", preventCopyPaste);
    window.addEventListener("paste", preventCopyPaste);
    window.addEventListener("cut", preventCopyPaste);
    window.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      window.removeEventListener("copy", preventCopyPaste);
      window.removeEventListener("paste", preventCopyPaste);
      window.removeEventListener("cut", preventCopyPaste);
      window.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [isExamStarted, isSubmitting]);

// ... existing code ...

      {/* Instruction Modal (Entry Gate) */}
      <Dialog open={!isExamStarted} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0c0c0e] border-red-500/20 text-white sm:max-w-lg [&>button]:hidden">
          <DialogHeader>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 mx-auto">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-2xl text-center">Exam Environment Rules</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2">
              You are about to enter a secure proctored environment. Please review the following strict regulations carefully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 bg-red-950/10 p-6 rounded-lg border border-red-500/10">
            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">Strict Full Screen Enforcement</strong>
                <span className="text-red-300">Leaving full screen mode will <u>immediately terminate and submit</u> your exam. No warnings.</span>
              </div>
            </div>
            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">No Tab Switching</strong>
                Moving to another tab or window is strictly prohibited.
              </div>
            </div>
            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">No Copy/Paste</strong>
                Clipboard functionality is completely disabled.
              </div>
            </div>
            <div className="flex gap-3 items-start text-sm mt-6 border-t border-red-500/10 pt-4">
              <FileWarning className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="text-orange-400">
                <strong>Violation Policy</strong>
                <p className="text-orange-400/70 text-xs mt-1">
                  Exiting full screen terminates the exam immediately. Other violations (like tab switching) allowed up to 3 times before auto-submission.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Cancel & Exit
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white px-8"
              onClick={startExam}
            >
              I Agree & Start Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exam;
