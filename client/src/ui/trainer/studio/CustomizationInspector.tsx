import { useState } from 'react';

import type {
  TrainerAppearance,
  TrainerAppearancePreset,
  TrainerCreationDraft,
  TrainerFacingDirection,
  TrainerForgeMode,
  TrainerMuscleId,
  TrainerPose,
} from '../../../game/types';
import {
  GameplayAttributesPanel,
  TrainerCustomizationControls,
} from '../TrainerCustomizationControls';
import { TrainerPreviewControls } from '../TrainerPreviewControls';
import {
  QUICK_FORGE_GROUPS,
  TRAINER_STUDIO_SECTIONS,
  getBodyControlGroup,
  getBodyRegion,
  type TrainerBodyRegionId,
  type TrainerStudioSection,
} from './studioConfig';

type CustomizationInspectorProps = Readonly<{
  activeSection: TrainerStudioSection;
  direction: TrainerFacingDirection;
  draft: TrainerCreationDraft;
  forgeMode: TrainerForgeMode;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
  onAppearancePresetsChange: (presets: readonly TrainerAppearancePreset[]) => void;
  onBodyGroupSelect: (groupId: string) => void;
  onGameplayPresetSelect: (presetId: string) => void;
  onMuscleChange: (key: TrainerMuscleId, value: number) => void;
  onPhysiquePresetSelect: (presetId: string) => void;
  onDirectionChange: (direction: TrainerFacingDirection) => void;
  onPoseChange: (pose: TrainerPose) => void;
  onSectionChange: (section: TrainerStudioSection) => void;
  pose: TrainerPose;
  selectedBodyGroupId: string;
  selectedBodyRegion: TrainerBodyRegionId;
}>;

const APPEARANCE_SECTION = {
  build: 'build',
  face: 'face',
  hair: 'hair',
  outfit: 'outfit',
  colors: 'colors',
  accessories: 'accessories',
} as const;

export function CustomizationInspector({
  activeSection,
  direction,
  draft,
  forgeMode,
  onAppearanceChange,
  onAppearancePresetsChange,
  onBodyGroupSelect,
  onGameplayPresetSelect,
  onMuscleChange,
  onPhysiquePresetSelect,
  onDirectionChange,
  onPoseChange,
  onSectionChange,
  pose,
  selectedBodyGroupId,
  selectedBodyRegion,
}: CustomizationInspectorProps) {
  const [selectedQuickGroupId, setSelectedQuickGroupId] =
    useState(QUICK_FORGE_GROUPS[0]!.id);
  const region = getBodyRegion(selectedBodyRegion);
  const group = getBodyControlGroup(selectedBodyRegion, selectedBodyGroupId);
  const quickGroup =
    QUICK_FORGE_GROUPS.find((entry) => entry.id === selectedQuickGroupId) ??
    QUICK_FORGE_GROUPS[0]!;
  const groupIds = forgeMode === 'quick' ? quickGroup.attributeIds : group.attributeIds;
  const groupLabel = forgeMode === 'quick' ? quickGroup.label : group.label;

  let content;
  if (activeSection === 'gameplay') {
    content = (
      <GameplayAttributesPanel
        draft={draft}
        onGameplayPresetSelect={onGameplayPresetSelect}
        onMuscleChange={onMuscleChange}
      />
    );
  } else if (activeSection === 'poses') {
    content = (
      <TrainerPreviewControls
        appearance={draft.appearance}
        appearancePresets={draft.appearancePresets}
        direction={direction}
        onAppearanceLoad={onAppearanceChange}
        onAppearancePresetsChange={onAppearancePresetsChange}
        onDirectionChange={onDirectionChange}
        onPoseChange={onPoseChange}
        pose={pose}
        section="poses"
      />
    );
  } else {
    const appearanceSection = APPEARANCE_SECTION[activeSection];
    content = (
      <TrainerCustomizationControls
        activeTab={appearanceSection}
        buildAttributeIds={activeSection === 'build' ? groupIds : undefined}
        buildGroupLabel={activeSection === 'build' ? groupLabel : undefined}
        draft={draft}
        onAppearanceChange={onAppearanceChange}
        onPhysiquePresetSelect={onPhysiquePresetSelect}
        poseContent={null}
        savedLooksContent={null}
      />
    );
  }

  return (
    <aside className="trainer-studio-inspector" aria-label="Customization inspector">
      <div className="trainer-studio-category-strip" role="tablist" aria-label="Trainer customization categories">
        {TRAINER_STUDIO_SECTIONS.map((section) => (
          <button
            aria-controls="trainer-studio-inspector-panel"
            aria-selected={activeSection === section.id}
            className={activeSection === section.id ? 'active' : ''}
            data-setup-control="true"
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            role="tab"
            type="button"
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'build' && (forgeMode === 'quick' || region.groups.length > 1) ? (
        <div className="trainer-studio-group-strip" aria-label={`${forgeMode === 'quick' ? 'Quick Forge' : region.label} control groups`}>
          {(forgeMode === 'quick' ? QUICK_FORGE_GROUPS : region.groups).map((entry) => (
            <button
              aria-pressed={(forgeMode === 'quick' ? quickGroup.id : group.id) === entry.id}
              className={(forgeMode === 'quick' ? quickGroup.id : group.id) === entry.id ? 'active' : ''}
              data-setup-control="true"
              key={entry.id}
              onClick={() =>
                forgeMode === 'quick'
                  ? setSelectedQuickGroupId(entry.id)
                  : onBodyGroupSelect(entry.id)
              }
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="trainer-studio-inspector-scroll"
        id="trainer-studio-inspector-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="trainer-studio-inspector-heading">
          <small>{activeSection === 'build' ? region.label : 'COSMETIC STUDIO'}</small>
          <h2>{TRAINER_STUDIO_SECTIONS.find((section) => section.id === activeSection)?.label}</h2>
        </div>
        {content}
      </div>
    </aside>
  );
}
