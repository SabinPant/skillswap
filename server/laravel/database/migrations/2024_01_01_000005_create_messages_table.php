<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
            $table->string('type')->default('text');
            $table->text('content')->nullable();
            $table->string('attachment_public_id')->nullable();
            $table->string('attachment_original_filename')->nullable();
            $table->string('attachment_mime_type')->nullable();
            $table->unsignedInteger('attachment_size_bytes')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['conversation_id', 'is_read']);
        });

        DB::statement('ALTER TABLE messages ADD CONSTRAINT chk_content_or_attachment CHECK (content IS NOT NULL OR attachment_public_id IS NOT NULL)');
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};