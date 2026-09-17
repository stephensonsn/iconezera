import { describe, expect, it } from "vitest";
import { normalize, translate } from "../src/translate";

describe("normalize", () => {
  it("remove acentos, caixa e espaços extras", () => {
    expect(normalize("  Coração   PARTIDO ")).toBe("coracao partido");
  });
});

describe("translate", () => {
  it("traduz termo simples com acento", () => {
    expect(translate("Usuário")).toEqual({ query: "user", translated: true });
  });
  it("traduz expressão inteira antes de palavra a palavra", () => {
    expect(translate("cartão de crédito").query).toBe("credit card");
  });
  it("traduz palavra a palavra ignorando preposições", () => {
    expect(translate("casa de cachorro").query).toBe("home dog");
  });
  it("resolve plural simples", () => {
    expect(translate("estrelas").query).toBe("star");
    expect(translate("flores").query).toBe("flower");
  });
  it("mantém termos desconhecidos (ex.: inglês)", () => {
    expect(translate("rocket")).toEqual({ query: "rocket", translated: false });
  });
  it("não marca como traduzido quando o termo é igual", () => {
    expect(translate("download").translated).toBe(false);
  });
  it("entrada vazia", () => {
    expect(translate("   ")).toEqual({ query: "", translated: false });
  });
});
