import { Lightbulb, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import ProseBlock from './ProseBlock.jsx';

const ICON = { tip: Lightbulb, note: Info, warning: AlertTriangle, important: AlertOctagon };
const DEFAULT_TITLE = { tip: 'Dica', note: 'Nota', warning: 'Atenção', important: 'Importante' };

export default function CalloutBox({ id, calloutType, title, markdown }) {
  const Icon = ICON[calloutType] ?? Info;
  return (
    <div id={id} className={`callout callout--${calloutType}`}>
      <Icon size={18} className="callout__icon" />
      <div className="callout__body">
        <p className="callout__title">{title ?? DEFAULT_TITLE[calloutType]}</p>
        <ProseBlock markdown={markdown} />
      </div>
    </div>
  );
}
