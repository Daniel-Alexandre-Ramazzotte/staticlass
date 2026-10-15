import { Compass } from 'lucide-react';
import ProseBlock from './ProseBlock.jsx';
import { appUrl } from '../../utils/paths.js';

export default function StoryBlock({ id, title, image, markdown }) {
  return (
    <div id={id} className="story">
      {image && (
        <img src={appUrl(image.src)} alt={image.alt} className="story__image" />
      )}
      <div className="story__body">
        <p className="story__title"><Compass size={16} /> {title}</p>
        <ProseBlock markdown={markdown} />
      </div>
    </div>
  );
}
