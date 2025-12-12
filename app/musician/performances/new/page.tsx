// app/musician/performances/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ActOption = {
  id: string;
  name: string;
  act_type: string | null;
};

export default function NewPerformancePage() {
  const router = useRouter();

  // フォーム項目
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().slice(0, 10), // 今日を初期値
  );
  const [actId, setActId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [memo, setMemo] = useState("");

  // ユーザー & 出演名義
  const [userId, setUserId] = useState<string | null>(null);
  const [acts, setActs] = useState<ActOption[]>([]);
  const [actsLoading, setActsLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // ログインユーザー＆その acts を読み込む
  useEffect(() => {
    const load = async () => {
      setActsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("getUser error or no user", userError);
        setUserId(null);
        setActs([]);
        setActsLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("acts")
        .select("id, name, act_type")
        .eq("owner_profile_id", user.id)
        .order("name", { ascending: true });

      if (error) {
        console.error("load acts error", error);
        setActs([]);
      } else {
        setActs((data ?? []) as ActOption[]);
      }

      setActsLoading(false);
    };

    void load();
  }, []);

  const handleSave = async () => {
    if (!userId) {
      alert("ログイン情報を取得できませんでした。いったんログインし直してください。");
      return;
    }
    if (!eventDate) {
      alert("日付は必須です。");
      return;
    }
    if (!actId) {
      alert("出演名義を選択してください。");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("musician_performances").insert({
      profile_id: userId,
      act_id: actId,
      event_date: eventDate,
      venue_name: venueName || null,
      memo: memo || null,
    });

    setSaving(false);

    if (error) {
      console.error("insert performance error", error);
      alert("保存に失敗しました。コンソールを確認してください。");
      return;
    }

    // 保存できたら一覧へ
    router.push("/musician/performances");
  };

  const noActs = !actsLoading && acts.length === 0;

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">新しいライブの記録</h1>
      <p className="text-sm text-gray-600 mb-2">
        まずは、すでに決まっている・終わったライブを
        自分のタイムラインとして残していくところから始めましょう。
      </p>

      <div className="space-y-3 max-w-md">
        {/* 日付 */}
        <label className="block">
          <span className="text-sm font-medium">日付（必須）</span>
          <input
            type="date"
            className="mt-1 border rounded px-2 py-1 w-full"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>

        {/* 出演名義 */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">出演名義（必須）</span>
            <Link
                href="/musician/acts"
                className="text-[11px] text-blue-600 hover:underline"
            >
                          出演名義を編集する
            </Link>

          </div>

          {actsLoading ? (
            <p className="text-xs text-gray-500 mt-1">
              出演名義を読み込み中です…
            </p>
          ) : noActs ? (
            <div className="mt-1 text-xs text-red-500 space-y-1">
              <p>まだ出演名義が登録されていません。</p>
              <p>
                プロフィール画面から、ソロ／バンド／ユニットなどの
                出演名義を少なくとも1つ作成してください。
              </p>
            </div>
          ) : (
            <select
              className="mt-1 border rounded px-2 py-1 w-full"
              value={actId}
              onChange={(e) => setActId(e.target.value)}
            >
              <option value="">選択してください</option>
              {acts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.act_type ? `（${a.act_type}）` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 会場名（自由入力） */}
        <label className="block">
          <span className="text-sm font-medium">会場</span>
          <input
            type="text"
            placeholder="例: NINETY EAST / 水戸駅前ストリート など"
            className="mt-1 border rounded px-2 py-1 w-full"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
          />
        </label>

        {/* メモ */}
        <label className="block">
          <span className="text-sm font-medium">メモ</span>
          <textarea
            className="mt-1 border rounded px-2 py-1 w-full h-24"
            placeholder="出演時間、共演者、イベント名、セットリストのメモなど自由に書けます。"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || actsLoading || noActs}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {saving ? "保存中…" : "このライブを記録する"}
        </button>

        {noActs && (
          <p className="text-[11px] text-gray-500">
            ※ 出演名義が1つもないと保存できません。まずはプロフィールから名義を作ってください。
          </p>
        )}
      </div>
    </main>
  );
}
