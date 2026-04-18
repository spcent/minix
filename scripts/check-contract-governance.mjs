import path from "node:path";
import ts from "typescript";
import { normalizePath } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const contractsRoot = path.join(repoRoot, "packages", "contracts", "src", "api");

const governanceTargets = [
  {
    file: "auth.ts",
    interface: "LoginResponse",
    required: ["session", "identity", "authStatus", "redirectTarget"],
  },
  {
    file: "auth.ts",
    interface: "RefreshTokenResponse",
    required: ["session", "identity", "authStatus", "redirectTarget"],
  },
  {
    file: "auth.ts",
    interface: "IdentityTransitionResponse",
    required: ["session", "identity", "authStatus", "redirectTarget"],
  },
  {
    file: "user.ts",
    interface: "CurrentUserResponse",
    required: ["userProfile", "accountSummary", "userStatus"],
  },
  {
    file: "user.ts",
    interface: "AccountOperationResponse",
    required: ["userProfile", "accountSummary", "userStatus"],
  },
  {
    file: "user.ts",
    interface: "UserRelationMutationResponse",
    required: ["accountSummary", "userStatus"],
  },
  {
    file: "user.ts",
    interface: "UserRelationListResponse",
    required: ["accountSummary", "userStatus"],
  },
  {
    file: "settings.ts",
    interface: "SettingsResponse",
    required: ["preferences", "featureToggles", "privacyOptions"],
  },
  {
    file: "message.ts",
    interface: "NotificationListResponse",
    required: ["notificationList", "messageThread", "unreadBadge"],
  },
  {
    file: "message.ts",
    interface: "MessageThreadResponse",
    required: ["messageThread", "unreadBadge"],
  },
  {
    file: "message.ts",
    interface: "MarkNotificationsReadResponse",
    required: ["notificationList", "unreadBadge"],
  },
  {
    file: "message.ts",
    interface: "SendMessageResponse",
    required: ["messageThread", "unreadBadge"],
  },
  {
    file: "payment.ts",
    interface: "OrderDetailResponse",
    required: ["order", "paymentIntent", "paymentResult", "entitlement"],
  },
  {
    file: "payment.ts",
    interface: "PurchaseOrderResponse",
    required: ["order", "paymentIntent", "paymentResult", "entitlement"],
  },
  {
    file: "membership.ts",
    interface: "PurchaseMembershipResponse",
    required: ["order", "paymentIntent", "paymentResult", "entitlement"],
  },
  {
    file: "content.ts",
    interface: "ContentDetailResponse",
    required: ["contentDetail", "contentAccess"],
  },
  {
    file: "content.ts",
    interface: "SaveContentDraftResponse",
    required: ["contentCard", "contentDetail", "contentAccess"],
  },
  {
    file: "content.ts",
    interface: "ContentLifecycleMutationResponse",
    required: ["contentCard", "contentDetail", "contentAccess"],
  },
  {
    file: "feed.ts",
    interface: "FeedListResponse",
    required: ["searchQuery", "searchFilters", "searchResults"],
  },
  {
    file: "novels.ts",
    interface: "NovelListResponse",
    required: ["searchQuery", "searchFilters", "searchResults"],
  },
  {
    file: "upload.ts",
    interface: "UploadSelectionResult",
    required: ["uploadTask", "uploadAsset", "uploadError"],
  },
  {
    file: "upload.ts",
    interface: "UploadPipelineResponse",
    required: ["uploadTask", "uploadAsset", "uploadError"],
  },
  {
    file: "share.ts",
    interface: "SharePrepareResponse",
    required: ["sharePayload", "shareChannel", "shareAttribution"],
  },
  {
    file: "share.ts",
    interface: "ShareReturnRecognitionResponse",
    required: ["sharePayload", "shareChannel", "shareAttribution"],
  },
  {
    file: "share.ts",
    interface: "ShareShortLinkResolveResponse",
    required: ["sharePayload", "shareChannel", "shareAttribution"],
  },
  {
    file: "share.ts",
    interface: "ShareAttributionReportResponse",
    required: ["sharePayload", "shareChannel", "shareAttribution"],
  },
  {
    file: "feedback.ts",
    interface: "FeedbackTicketDetailResponse",
    required: ["feedbackTicket", "feedbackCategory", "feedbackStatus"],
  },
  {
    file: "feedback.ts",
    interface: "SubmitFeedbackResponse",
    required: ["feedbackTicket", "feedbackCategory", "feedbackStatus"],
  },
  {
    file: "feedback.ts",
    interface: "FeedbackRevisitResponse",
    required: ["feedbackTicket", "feedbackCategory", "feedbackStatus"],
  },
  {
    file: "feedback.ts",
    interface: "FeedbackTicketActionResponse",
    required: ["feedbackTicket", "feedbackCategory", "feedbackStatus"],
  },
];

const targetFiles = [...new Set(governanceTargets.map((target) => path.join(contractsRoot, target.file)))];
const program = ts.createProgram(targetFiles, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();

function getDeclaration(sourceFile, interfaceName) {
  for (const statement of sourceFile.statements) {
    if ((ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) && statement.name.text === interfaceName) {
      return statement;
    }
  }
  return undefined;
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

async function main() {
  const violations = [];

  for (const target of governanceTargets) {
    const filePath = path.join(contractsRoot, target.file);
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      violations.push({
        filePath,
        line: 1,
        interfaceName: target.interface,
        missing: [`<source file ${target.file} not found>`],
      });
      continue;
    }

    const declaration = getDeclaration(sourceFile, target.interface);
    if (!declaration) {
      violations.push({
        filePath,
        line: 1,
        interfaceName: target.interface,
        missing: ["<declaration not found>"],
      });
      continue;
    }

    const type = checker.getTypeAtLocation(declaration.name);
    const propertyNames = new Set(checker.getPropertiesOfType(type).map((property) => property.getName()));
    const missing = target.required.filter((field) => !propertyNames.has(field));
    if (missing.length > 0) {
      violations.push({
        filePath,
        line: lineOf(sourceFile, declaration.name),
        interfaceName: target.interface,
        missing,
      });
    }
  }

  if (violations.length === 0) {
    console.log(`contract governance check passed for ${governanceTargets.length} canonical response interfaces`);
    return;
  }

  console.error("contract governance check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}:${violation.line} ${violation.interfaceName} is missing ${violation.missing.join(", ")}`);
    console.error("  canonical response owners must preserve their shared output fields.");
  }
  process.exitCode = 1;
}

await main();
