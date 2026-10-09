export type Role = "admin" | "common" | "group";
export type ProjectStatus = "planned" | "active" | "delayed" | "completed" | "cancelled";
export type OfficialReviewStatus = "unverified" | "accepted" | "rejected" | "referred" | "more_info" | "duplicate";
export type GroupTaskStatus = "adopted" | "in_progress" | "awaiting_confirmation" | "confirmed" | "disputed" | "reopened" | "referred";
export type IssueCategory = "pothole" | "damaged_road" | "fallen_tree" | "streetlight" | "open_drain" | "leak" | "garbage" | "blocked_footpath" | "other";
export type IssueSource = "citizen" | "external" | "detector";
export interface Project {id:string;slug:string;title:string;description:string;department:string;contractor:string;location:string;latitude:number;longitude:number;startDate:string;expectedEndDate:string;status:ProjectStatus;budget?:number;updatedAt:string}
export interface Issue {id:string;title:string;description:string;category:IssueCategory;location:string;latitude:number;longitude:number;observedAt:string;createdAt:string;verificationCount:number;reviewStatus:OfficialReviewStatus;urgent:boolean;source:IssueSource}
export interface CommunityGroup {id:string;slug:string;name:string;description:string;area:string;contact:string;capabilities:IssueCategory[];approved:boolean}
export interface GroupTask {id:string;issueId:string;groupId:string;status:GroupTaskStatus;updatedAt:string;completionEvidence?:string;confirmationCount:number}
export const statusLabels:Record<ProjectStatus,string>={planned:"Planned",active:"In progress",delayed:"Delayed",completed:"Completed",cancelled:"Cancelled"};
