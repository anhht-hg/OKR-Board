-- CreateIndex
CREATE INDEX "ActionItem_goalId_idx" ON "ActionItem"("goalId");

-- CreateIndex
CREATE INDEX "KpiItem_planId_idx" ON "KpiItem"("planId");

-- CreateIndex
CREATE INDEX "MonthlyGoal_planId_idx" ON "MonthlyGoal"("planId");
