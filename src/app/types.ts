export type AppRole = 'admin' | 'student';

export type AppUser = {
  id: string;
  role: AppRole;
  displayName: string;
  loginUsername: string;
  organizationId: string;
};

export type StudentTask = {
  id: string;
  label: string;
  completed: boolean;
};

export type DailySubmission = {
  uykuUyanma: string;
  gunlukCalisma: string;
  ekranSuresi: string;
  notlar: string;
};

export type StudentSummary = {
  id: string;
  name: string;
};

export const emptyDailySubmission = (): DailySubmission => ({
  uykuUyanma: '',
  gunlukCalisma: '',
  ekranSuresi: '',
  notlar: '',
});
