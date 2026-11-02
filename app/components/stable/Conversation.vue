<script setup lang="ts">
/**
 * The conversation of a stable promotion request: comments and status changes, oldest first, and
 * a Markdown reply box. Used by the publisher dashboard and the admin area, which pass their own
 * `send` (a different API route each).
 */
import {
	STABLE_STATUS_CHANGE_TEXT,
	STABLE_STATUS_META,
	type StableRequestMessage,
} from "~/utils/stablePromotion";

const props = withDefaults(
	defineProps<{
		messages: StableRequestMessage[];
		loading?: boolean;
		/** Shown instead of the reply box when replying is not possible. */
		closedText?: string | null;
		/** Posts a reply; resolves to true on success, which clears the box. */
		send?: (body: string) => Promise<boolean>;
		placeholder?: string;
	}>(),
	{
		loading: false,
		closedText: null,
		send: undefined,
		placeholder: "Write a reply… Markdown works too.",
	},
);

const draft = ref("");
const sending = ref(false);

const canSend = computed(() => draft.value.trim().length > 0 && !sending.value);

async function submit() {
	if (!props.send || !canSend.value) return;
	sending.value = true;
	const ok = await props.send(draft.value.trim());
	sending.value = false;
	if (ok) draft.value = "";
}

function authorName(message: StableRequestMessage) {
	if (message.author_user_id === null) {
		return message.kind === "status_change" ? "LeiOS" : "Deleted user";
	}
	return message.author_display_name || message.author_username || "Unknown user";
}

function initials(message: StableRequestMessage) {
	return authorName(message)
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

const STAFF_BADGES: Record<string, { label: string; color: "error" | "info" }> = {
	admin: { label: "Admin", color: "error" },
	moderator: { label: "Moderator", color: "info" },
};
</script>

<template>
	<div class="space-y-4">
		<div v-if="loading && !messages.length" class="space-y-3">
			<USkeleton class="h-16 w-full" />
			<USkeleton class="h-16 w-2/3" />
		</div>

		<p v-else-if="!messages.length" class="text-sm text-slate-500">
			No messages yet. Start the conversation below.
		</p>

		<ol v-else class="space-y-4">
			<li v-for="message in messages" :key="message.id">
				<!-- Status change: one line in the timeline, with the comment that came with it. -->
				<div v-if="message.kind === 'status_change' && message.status" class="space-y-2">
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
						<span
							class="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-800"
						>
							<UIcon
								:name="STABLE_STATUS_META[message.status].icon"
								:class="['size-4', STABLE_STATUS_META[message.status].textClass]"
							/>
						</span>
						<span class="font-medium text-slate-200">{{ authorName(message) }}</span>
						<UBadge
							v-if="message.author_role && STAFF_BADGES[message.author_role]"
							:color="STAFF_BADGES[message.author_role]!.color"
							variant="subtle"
							size="xs"
						>
							{{ STAFF_BADGES[message.author_role]!.label }}
						</UBadge>
						<span>{{ STABLE_STATUS_CHANGE_TEXT[message.status] }}</span>
						<span class="text-xs text-slate-500">· {{ formatDate(message.created_at) }}</span>
					</div>
					<div
						v-if="message.body"
						class="ms-9 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
					>
						<MarkdownContent :value="message.body" compact />
					</div>
				</div>

				<!-- Comment -->
				<div v-else class="flex gap-3">
					<UAvatar :text="initials(message)" size="sm" class="mt-0.5 shrink-0" />
					<div class="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900/60">
						<div
							class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-800 px-4 py-2 text-sm"
						>
							<span class="font-medium text-slate-200">{{ authorName(message) }}</span>
							<span v-if="message.author_username" class="text-slate-500">
								@{{ message.author_username }}
							</span>
							<UBadge
								v-if="message.author_role && STAFF_BADGES[message.author_role]"
								:color="STAFF_BADGES[message.author_role]!.color"
								variant="subtle"
								size="xs"
							>
								{{ STAFF_BADGES[message.author_role]!.label }}
							</UBadge>
							<span class="ms-auto text-xs text-slate-500">{{ formatDate(message.created_at) }}</span>
						</div>
						<div class="px-4 py-3">
							<MarkdownContent :value="message.body" compact />
						</div>
					</div>
				</div>
			</li>
		</ol>

		<UAlert
			v-if="closedText"
			color="neutral"
			variant="subtle"
			icon="i-lucide-lock"
			:description="closedText"
		/>

		<div v-else-if="send" class="space-y-2">
			<MarkdownEditor
				v-model="draft"
				:placeholder="placeholder"
				:disabled="sending"
				min-height-class="min-h-24"
			/>
			<div class="flex justify-end">
				<UButton
					label="Send reply"
					icon="i-lucide-send"
					:loading="sending"
					:disabled="!canSend"
					@click="submit()"
				/>
			</div>
		</div>
	</div>
</template>
