import { t } from '../../../../localization/i18n';
import type { ComponentKind } from '../../domain/models';
export const componentLabel = (kind: ComponentKind) => t(kind === 'photoelectric-sensor' ? 'Photoelectric sensor' : kind);
