<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_skills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('skill_id')->constrained()->cascadeOnDelete();
            $table->string('proficiency_level');
            $table->boolean('can_teach')->default(false);
            $table->boolean('wants_to_learn')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'skill_id']);
            $table->index(['skill_id', 'can_teach']);
        });

        DB::statement('ALTER TABLE user_skills ADD CONSTRAINT chk_teach_or_learn CHECK (can_teach = true OR wants_to_learn = true)');
    }

    public function down(): void
    {
        Schema::dropIfExists('user_skills');
    }
};