import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { AdsNoticeState } from "../types";

export function CampaignCreateSection({
  campaignName,
  campaignObjective,
  campaignStartAt,
  campaignEndAt,
  dailyBudget,
  totalBudget,
  notice,
  isCreating,
  onCampaignNameChange,
  onCampaignObjectiveChange,
  onCampaignStartAtChange,
  onCampaignEndAtChange,
  onDailyBudgetChange,
  onTotalBudgetChange,
  onSubmit,
}: {
  campaignName: string;
  campaignObjective: string;
  campaignStartAt: string;
  campaignEndAt: string;
  dailyBudget: string;
  totalBudget: string;
  notice: AdsNoticeState | null;
  isCreating: boolean;
  onCampaignNameChange: (value: string) => void;
  onCampaignObjectiveChange: (value: string) => void;
  onCampaignStartAtChange: (value: string) => void;
  onCampaignEndAtChange: (value: string) => void;
  onDailyBudgetChange: (value: string) => void;
  onTotalBudgetChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <AdminSectionCard
      eyebrow="Advertising"
      title="Create Campaign"
      description="Launch a campaign with a clear objective, structured schedule, and explicit budget constraints."
    >
      <div className="space-y-4">
        {notice ? <AdminNotice notice={notice} /> : null}

        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          className="space-y-0"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormItem>
              <FormLabel htmlFor="campaign-name" required>
                Campaign name
              </FormLabel>
              <FormControl>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(event) => onCampaignNameChange(event.target.value)}
                  placeholder="Summer Growth Push"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="campaign-start">Start at</FormLabel>
              <FormControl>
                <Input
                  id="campaign-start"
                  type="datetime-local"
                  value={campaignStartAt}
                  onChange={(event) => onCampaignStartAtChange(event.target.value)}
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="campaign-end">End at</FormLabel>
              <FormControl>
                <Input
                  id="campaign-end"
                  type="datetime-local"
                  value={campaignEndAt}
                  onChange={(event) => onCampaignEndAtChange(event.target.value)}
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="campaign-daily-budget">
                Daily budget (paise)
              </FormLabel>
              <FormControl>
                <Input
                  id="campaign-daily-budget"
                  type="number"
                  value={dailyBudget}
                  onChange={(event) => onDailyBudgetChange(event.target.value)}
                  placeholder="50000"
                />
              </FormControl>
              <FormDescription>Optional daily cap for pacing.</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="campaign-total-budget">
                Total budget (paise)
              </FormLabel>
              <FormControl>
                <Input
                  id="campaign-total-budget"
                  type="number"
                  value={totalBudget}
                  onChange={(event) => onTotalBudgetChange(event.target.value)}
                  placeholder="300000"
                />
              </FormControl>
              <FormDescription>Optional overall campaign cap.</FormDescription>
            </FormItem>

            <FormItem className="md:col-span-2 xl:col-span-3">
              <FormLabel htmlFor="campaign-objective">Objective</FormLabel>
              <FormControl>
                <Input
                  id="campaign-objective"
                  value={campaignObjective}
                  onChange={(event) =>
                    onCampaignObjectiveChange(event.target.value)
                  }
                  placeholder="Increase creator acquisition in high-retention cohorts"
                />
              </FormControl>
              <FormDescription>
                Optional campaign context for future audit and reporting.
              </FormDescription>
            </FormItem>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create campaign"}
            </Button>
          </div>
        </Form>
      </div>
    </AdminSectionCard>
  );
}
