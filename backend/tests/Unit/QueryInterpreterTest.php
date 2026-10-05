<?php

namespace Tests\Unit;

use App\Services\Ai\QueryInterpreter;
use PHPUnit\Framework\TestCase;

class QueryInterpreterTest extends TestCase
{
    public function test_it_reads_a_budget_and_a_category_from_a_sentence(): void
    {
        $parser = new QueryInterpreter;
        $parsed = $parser->parse('Je cherche un réfrigérateur de grande capacité à moins de 400000 FCFA', [
            ['id' => 4, 'name' => 'Réfrigérateur', 'slug' => 'refrigerateur'],
        ]);

        $this->assertSame(400000, $parsed['max_price']);
        $this->assertSame('refrigerateur', $parsed['category']);
        $this->assertContains('grande', $parsed['keywords']);
    }

    public function test_it_marks_a_multi_product_request_when_a_budget_is_present(): void
    {
        $parser = new QueryInterpreter;
        $parsed = $parser->parse('Je veux équiper mon salon avec 800000 FCFA');

        $this->assertTrue($parsed['multi']);
        $this->assertSame(800000, $parsed['max_price']);
    }

    public function test_it_reads_a_house_budget_written_as_i_have(): void
    {
        $parser = new QueryInterpreter;
        $parsed = $parser->parse("j'ai 2000000 et je veux équiper ma maison");

        $this->assertSame(2000000, $parsed['max_price']);
        $this->assertTrue($parsed['multi']);
    }
}
