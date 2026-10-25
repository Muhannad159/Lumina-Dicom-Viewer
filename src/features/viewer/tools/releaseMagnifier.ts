import { MagnifyTool, type Types } from '@cornerstonejs/tools';

// Cornerstone 4's temporary magnifier viewport normally lives until pointer-up.
// End it explicitly if its parent viewport or active tool changes mid-gesture.
export function releaseMagnifier(group: Types.IToolGroup) {
  const tool = group.getToolInstance(MagnifyTool.toolName) as MagnifyTool | undefined;
  const element = tool?.editData?.enabledElement.viewport.element;
  if (element?.querySelector('.magnifyTool')) {
    tool!._dragEndCallback(
      new CustomEvent('magnifier-cancel', {
        detail: { element },
      }) as Types.EventTypes.InteractionEventType,
    );
  }
}
