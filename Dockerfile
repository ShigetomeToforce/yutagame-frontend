FROM denoland/deno:2.1.4

WORKDIR /app

# ① 変更が少ない設定ファイル（deno.json）だけを先にコピーしてキャッシュを活かす
COPY deno.json /app/
# ※もし deno.lock が手元にあればそれも巻き込めるよう、念のためアスタリスク付きで指定
COPY deno.lock* /app/

# ② 依存モジュールをあらかじめコンテナ内にキャッシュ
RUN deno cache --node-modules-dir=false || true

# ③ 残りのフロントエンドのソースコードを丸ごとコピー
COPY . .

EXPOSE 8000

# ④ Freshの起動タスクを実行
CMD ["deno", "task", "start"]