import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { IKnowledgeFolder } from "@/interfaces/IKnowledgeFolder";

export interface DocumentCardProps {
  doc: IKnowledgeFolder;
  onDelete: (doc: IKnowledgeFolder) => void;
  onView: (doc: IKnowledgeFolder) => void;
  onReupload: (doc: IKnowledgeFolder) => void;
  onSelect: (doc: IKnowledgeFolder) => void;
}

const ACTION_TYPES = {
  VIEW: "View",
  REUPLOAD: "Re-upload",
  DELETE: "Delete",
  SELECT: "Select",
} as const;

type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

const DocumentCard: FC<DocumentCardProps> = ({ doc, onDelete, onView, onReupload, onSelect }) => {
  const { t } = useTranslation();
  const handleAction = (actionType: ActionType) => {
    switch (actionType) {
      case ACTION_TYPES.VIEW:
        onView(doc);
        break;
      case ACTION_TYPES.REUPLOAD:
        onReupload(doc);
        break;
      case ACTION_TYPES.DELETE:
        onDelete(doc);
        break;
      case ACTION_TYPES.SELECT:
        onSelect(doc);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div>{doc.name}</div>
      <button onClick={() => handleAction(ACTION_TYPES.VIEW)} aria-label={t('documentCard.view')}>{t('documentCard.view')}</button>
      <button onClick={() => handleAction(ACTION_TYPES.REUPLOAD)} aria-label={t('documentCard.reupload')}>{t('documentCard.reupload')}</button>
      <button onClick={() => handleAction(ACTION_TYPES.DELETE)} aria-label={t('documentCard.delete')}>{t('documentCard.delete')}</button>
      <button onClick={() => handleAction(ACTION_TYPES.SELECT)} aria-label={t('documentCard.select')}>{t('documentCard.select')}</button>
    </div>
  );
};

export default DocumentCard;
