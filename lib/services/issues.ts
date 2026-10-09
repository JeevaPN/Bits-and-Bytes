import { issues } from "@/lib/domain/demo-data";
export function rankedGroupIssues(){return [...issues].sort((a,b)=>Number(b.urgent)-Number(a.urgent)||b.verificationCount-a.verificationCount||a.createdAt.localeCompare(b.createdAt));}
const demoVerifications=new Set<string>();
export function verifyIssue(issueId:string,userId:string){const issue=issues.find(item=>item.id===issueId);if(!issue)throw new Error("Issue not found");const key=`${issueId}:${userId}`;if(demoVerifications.has(key))throw new Error("You have already verified this issue.");demoVerifications.add(key);issue.verificationCount+=1;return issue.verificationCount;}
