import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCcw } from "lucide-react";
import { commands } from "@/bindings";

import { Alert } from "../../ui/Alert";
import {
  Dropdown,
  SettingContainer,
  SettingsGroup,
  Textarea,
} from "@/components/ui";
import { Button } from "../../ui/Button";
import { ResetButton } from "../../ui/ResetButton";
import { Input } from "../../ui/Input";
import { PostProcessingToggle } from "../PostProcessingToggle";

import { ProviderSelect } from "../PostProcessingSettingsApi/ProviderSelect";
import { BaseUrlField } from "../PostProcessingSettingsApi/BaseUrlField";
import { ApiKeyField } from "../PostProcessingSettingsApi/ApiKeyField";
import { ModelSelect } from "../PostProcessingSettingsApi/ModelSelect";
import { usePostProcessProviderState } from "../PostProcessingSettingsApi/usePostProcessProviderState";
import { useSettings } from "../../../hooks/useSettings";

const DisabledNotice: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="p-4 bg-mid-gray/5 rounded-lg border border-mid-gray/20">
    <p className="text-sm text-mid-gray">{children}</p>
  </div>
);

const PostProcessingSettingsApiComponent: React.FC = () => {
  const { t } = useTranslation();
  const state = usePostProcessProviderState();

  return (
    <>
      <PostProcessingToggle descriptionMode="tooltip" grouped={true} />

      {state.enabled && (
        <>
          <SettingContainer
            title={t("settings.postProcessing.api.provider.title")}
            description={t("settings.postProcessing.api.provider.description")}
            descriptionMode="tooltip"
            layout="horizontal"
            grouped={true}
          >
            <div className="flex items-center gap-2">
              <ProviderSelect
                options={state.providerOptions}
                value={state.selectedProviderId}
                onChange={state.handleProviderSelect}
              />
            </div>
          </SettingContainer>

          {state.isAppleProvider ? (
            state.appleIntelligenceUnavailable ? (
              <Alert variant="error" contained>
                {t("settings.postProcessing.api.appleIntelligence.unavailable")}
              </Alert>
            ) : null
          ) : (
            <>
              {state.selectedProvider?.allow_base_url_edit && (
                <SettingContainer
                  title={t("settings.postProcessing.api.baseUrl.title")}
                  description={t("settings.postProcessing.api.baseUrl.description")}
                  descriptionMode="tooltip"
                  layout="horizontal"
                  grouped={true}
                >
                  <div className="flex items-center gap-2">
                    <BaseUrlField
                      value={state.baseUrl}
                      onBlur={state.handleBaseUrlChange}
                      placeholder={t(
                        "settings.postProcessing.api.baseUrl.placeholder",
                      )}
                      disabled={state.isBaseUrlUpdating}
                      className="min-w-[380px]"
                    />
                  </div>
                </SettingContainer>
              )}

              {!state.isKeylessProvider && (
                <SettingContainer
                  title={t("settings.postProcessing.api.apiKey.title")}
                  description={t("settings.postProcessing.api.apiKey.description")}
                  descriptionMode="tooltip"
                  layout="horizontal"
                  grouped={true}
                >
                  <div className="flex items-center gap-2">
                    <ApiKeyField
                      value={state.apiKey}
                      onBlur={state.handleApiKeyChange}
                      placeholder={t(
                        "settings.postProcessing.api.apiKey.placeholder",
                      )}
                      disabled={state.isApiKeyUpdating}
                      className="min-w-[320px]"
                    />
                  </div>
                </SettingContainer>
              )}
            </>
          )}

          {!state.isAppleProvider && (
            <SettingContainer
              title={t("settings.postProcessing.api.model.title")}
              description={
                state.isCustomProvider
                  ? t("settings.postProcessing.api.model.descriptionCustom")
                  : t("settings.postProcessing.api.model.descriptionDefault")
              }
              descriptionMode="tooltip"
              layout="stacked"
              grouped={true}
            >
              <div className="flex items-center gap-2">
                <ModelSelect
                  value={state.model}
                  options={state.modelOptions}
                  disabled={state.isModelUpdating}
                  isLoading={state.isFetchingModels}
                  placeholder={
                    state.modelOptions.length > 0
                      ? t(
                        "settings.postProcessing.api.model.placeholderWithOptions",
                      )
                      : t("settings.postProcessing.api.model.placeholderNoOptions")
                  }
                  onSelect={state.handleModelSelect}
                  onCreate={state.handleModelCreate}
                  onBlur={() => { }}
                  className="flex-1 min-w-[380px]"
                />
                <ResetButton
                  onClick={state.handleRefreshModels}
                  disabled={state.isFetchingModels}
                  ariaLabel={t("settings.postProcessing.api.model.refreshModels")}
                  className="flex h-10 w-10 items-center justify-center"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${state.isFetchingModels ? "animate-spin" : ""}`}
                  />
                </ResetButton>
              </div>
            </SettingContainer>
          )}
        </>
      )}
    </>
  );
};

const PostProcessingSettingsPromptsComponent: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating, refreshSettings } =
    useSettings();
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftText, setDraftText] = useState("");

  const enabled = getSetting("post_process_enabled") || false;
  const prompts = getSetting("post_process_prompts") || [];
  const selectedPromptId = getSetting("post_process_selected_prompt_id") || "";
  const selectedPrompt =
    prompts.find((prompt) => prompt.id === selectedPromptId) || null;

  useEffect(() => {
    if (isCreating) return;

    if (selectedPrompt) {
      setDraftName(selectedPrompt.name);
      setDraftText(selectedPrompt.prompt);
    } else {
      setDraftName("");
      setDraftText("");
    }
  }, [
    isCreating,
    selectedPromptId,
    selectedPrompt?.name,
    selectedPrompt?.prompt,
  ]);

  const handlePromptSelect = (promptId: string | null) => {
    if (!promptId) return;
    updateSetting("post_process_selected_prompt_id", promptId);
    setIsCreating(false);
  };

  const handleCreatePrompt = async () => {
    if (!draftName.trim() || !draftText.trim()) return;

    try {
      const result = await commands.addPostProcessPrompt(
        draftName.trim(),
        draftText.trim(),
      );
      if (result.status === "ok") {
        await refreshSettings();
        updateSetting("post_process_selected_prompt_id", result.data.id);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Failed to create prompt:", error);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!selectedPromptId || !draftName.trim() || !draftText.trim()) return;

    try {
      await commands.updatePostProcessPrompt(
        selectedPromptId,
        draftName.trim(),
        draftText.trim(),
      );
      await refreshSettings();
    } catch (error) {
      console.error("Failed to update prompt:", error);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!promptId) return;

    try {
      await commands.deletePostProcessPrompt(promptId);
      await refreshSettings();
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    if (selectedPrompt) {
      setDraftName(selectedPrompt.name);
      setDraftText(selectedPrompt.prompt);
    } else {
      setDraftName("");
      setDraftText("");
    }
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setDraftName("");
    setDraftText("");
  };

  if (!enabled) {
    return (
      <DisabledNotice>
        {t("settings.postProcessing.disabledNotice")}
      </DisabledNotice>
    );
  }

  const hasPrompts = prompts.length > 0;
  const isDirty =
    !!selectedPrompt &&
    (draftName.trim() !== selectedPrompt.name ||
      draftText.trim() !== selectedPrompt.prompt.trim());

  return (
    <SettingContainer
      title={t("settings.postProcessing.prompts.selectedPrompt.title")}
      description={t(
        "settings.postProcessing.prompts.selectedPrompt.description",
      )}
      descriptionMode="tooltip"
      layout="stacked"
      grouped={true}
    >
      <div className="space-y-2">
        <div className="flex gap-2">
          <Dropdown
            selectedValue={selectedPromptId || null}
            options={prompts.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            onSelect={(value) => handlePromptSelect(value)}
            placeholder={
              prompts.length === 0
                ? t("settings.postProcessing.prompts.noPrompts")
                : t("settings.postProcessing.prompts.selectPrompt")
            }
            disabled={
              isUpdating("post_process_selected_prompt_id") || isCreating
            }
            className="flex-1"
          />
          <Button
            onClick={handleStartCreate}
            variant="primary"
            size="sm"
            disabled={isCreating}
          >
            {t("settings.postProcessing.prompts.createNew")}
          </Button>
        </div>

        {!isCreating && hasPrompts && selectedPrompt && (
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">
                {t("settings.postProcessing.prompts.promptLabel")}
              </label>
              <Input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={t(
                  "settings.postProcessing.prompts.promptLabelPlaceholder",
                )}
                variant="compact"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">
                {t("settings.postProcessing.prompts.promptInstructions")}
              </label>
              <Textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                autoGrow={true}
                rows={4}
                className="min-h-[100px] max-h-[150px] text-sm"
                placeholder={t(
                  "settings.postProcessing.prompts.promptInstructionsPlaceholder",
                )}
              />
              <p
                className="text-xs text-mid-gray/70"
                dangerouslySetInnerHTML={{
                  __html: t("settings.postProcessing.prompts.promptTip"),
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdatePrompt}
                variant="primary"
                size="sm"
                disabled={!draftName.trim() || !draftText.trim() || !isDirty}
              >
                {t("settings.postProcessing.prompts.updatePrompt")}
              </Button>
              <Button
                onClick={() => handleDeletePrompt(selectedPromptId)}
                variant="secondary"
                size="sm"
                disabled={!selectedPromptId || prompts.length <= 1}
              >
                {t("settings.postProcessing.prompts.deletePrompt")}
              </Button>
            </div>
          </div>
        )}

        {!isCreating && !selectedPrompt && (
          <div className="p-2 bg-mid-gray/5 rounded border border-mid-gray/20">
            <p className="text-xs text-mid-gray">
              {hasPrompts
                ? t("settings.postProcessing.prompts.selectToEdit")
                : t("settings.postProcessing.prompts.createFirst")}
            </p>
          </div>
        )}

        {isCreating && (
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text">
                {t("settings.postProcessing.prompts.promptLabel")}
              </label>
              <Input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={t(
                  "settings.postProcessing.prompts.promptLabelPlaceholder",
                )}
                variant="compact"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">
                {t("settings.postProcessing.prompts.promptInstructions")}
              </label>
              <Textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                autoGrow={true}
                rows={4}
                className="min-h-[100px] max-h-[150px] text-sm"
                placeholder={t(
                  "settings.postProcessing.prompts.promptInstructionsPlaceholder",
                )}
              />
              <p
                className="text-xs text-mid-gray/70"
                dangerouslySetInnerHTML={{
                  __html: t("settings.postProcessing.prompts.promptTip"),
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreatePrompt}
                variant="primary"
                size="sm"
                disabled={!draftName.trim() || !draftText.trim()}
              >
                {t("settings.postProcessing.prompts.createPrompt")}
              </Button>
              <Button
                onClick={handleCancelCreate}
                variant="secondary"
                size="sm"
              >
                {t("settings.postProcessing.prompts.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SettingContainer>
  );
};

export const PostProcessingSettingsApi = React.memo(
  PostProcessingSettingsApiComponent,
);
PostProcessingSettingsApi.displayName = "PostProcessingSettingsApi";

export const PostProcessingSettingsPrompts = React.memo(
  PostProcessingSettingsPromptsComponent,
);
PostProcessingSettingsPrompts.displayName = "PostProcessingSettingsPrompts";

const PostProcessingTestComponent: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Track settings that affect test output
  const providerId = getSetting("post_process_provider_id");
  const selectedPromptId = getSetting("post_process_selected_prompt_id");
  const models = getSetting("post_process_models");
  const currentModel = models?.[providerId || ""] || "";

  // Reset output when settings change
  useEffect(() => {
    setOutputText("");
    setError(null);
  }, [providerId, selectedPromptId, currentModel]);

  // Timer effect for elapsed time
  useEffect(() => {
    if (isRunning) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 100);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleRunTest = async () => {
    if (!inputText.trim()) return;

    abortControllerRef.current = new AbortController();
    setIsRunning(true);
    setError(null);
    setOutputText("");
    setCopied(false);

    try {
      const result = await commands.testPostProcess(inputText);

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (result.status === "ok") {
        setOutputText(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      setError(typeof err === "string" ? err : String(err));
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    setError(null);
  };

  const handleCopyOutput = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div
      className="space-y-3 p-4 rounded-xl border border-mid-gray/20 bg-gradient-to-br from-white to-gray-50 dark:from-dark-gray dark:to-neutral-900 shadow-sm"
      role="region"
      aria-label={t("settings.postProcessing.test.title")}
    >
      {/* Input */}
      <div className="flex flex-col">
        <label
          htmlFor="test-input"
          className="text-xs font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300"
        >
          {t("settings.postProcessing.test.inputLabel")}
        </label>
        <Textarea
          id="test-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t("settings.postProcessing.test.inputPlaceholder")}
          autoGrow={true}
          rows={3}
          className="min-h-[80px] text-sm transition-shadow focus:shadow-md"
          aria-describedby="test-description"
        />
        <p id="test-description" className="sr-only">
          {t("settings.postProcessing.test.description")}
        </p>
      </div>

      {/* Output */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t("settings.postProcessing.test.output")}
          </label>
          {outputText && (
            <button
              onClick={handleCopyOutput}
              className="text-xs px-2 py-0.5 rounded bg-mid-gray/10 hover:bg-mid-gray/20 transition-colors text-mid-gray"
              aria-label="Copy output to clipboard"
            >
              {copied ? t("settings.postProcessing.test.copied") : t("settings.postProcessing.test.copy")}
            </button>
          )}
        </div>
        <div
          className="p-3 rounded-lg border border-mid-gray/20 whitespace-pre-wrap text-sm min-h-[80px] max-h-[120px] bg-white dark:bg-neutral-800 overflow-auto"
          role="status"
          aria-live="polite"
          aria-busy={isRunning}
        >
          {isRunning ? (
            <div className="flex items-center justify-center h-full gap-2">
              <div className="w-5 h-5 border-2 border-mid-gray/20 border-t-pink-500 rounded-full animate-spin" />
              <span className="text-mid-gray text-xs">
                {t("settings.postProcessing.test.running")} {formatTime(elapsedTime)}
              </span>
            </div>
          ) : outputText ? (
            <span className="text-neutral-800 dark:text-neutral-200">{outputText}</span>
          ) : (
            <span className="text-mid-gray/60 italic text-xs">
              {t("settings.postProcessing.test.noOutput")}
            </span>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="error" contained>
          {error}
        </Alert>
      )}

      {/* Action buttons - Compact */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleRunTest}
          variant="primary"
          size="sm"
          disabled={isRunning || !inputText.trim()}
          aria-busy={isRunning}
          className="transition-all hover:shadow-md"
        >
          {t("settings.postProcessing.test.runTest")}
        </Button>

        {isRunning && (
          <Button
            onClick={handleCancel}
            variant="secondary"
            size="sm"
          >
            {t("settings.postProcessing.test.cancel")}
          </Button>
        )}

        {!isRunning && elapsedTime > 0 && outputText && (
          <span className="text-xs text-mid-gray">
            {t("settings.postProcessing.test.completedIn", { time: formatTime(elapsedTime) })}
          </span>
        )}
      </div>
    </div>
  );
};

export const PostProcessingTest = React.memo(PostProcessingTestComponent);
PostProcessingTest.displayName = "PostProcessingTest";

export const PostProcessingSettings: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl w-full mx-auto space-y-4">
      {/* API Settings - Compact */}
      <SettingsGroup title={t("settings.postProcessing.api.title")}>
        <PostProcessingSettingsApi />
      </SettingsGroup>

      {/* Prompt & Test - Side by side for better space usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SettingsGroup title={t("settings.postProcessing.prompts.title")}>
          <PostProcessingSettingsPrompts />
        </SettingsGroup>

        <SettingsGroup title={t("settings.postProcessing.test.title")}>
          <PostProcessingTest />
        </SettingsGroup>
      </div>
    </div>
  );
};

