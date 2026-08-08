type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postalCode: string }> },
) {
  const { postalCode } = await params;

  if (!/^\d{8}$/.test(postalCode)) {
    return Response.json(
      { message: "Informe um CEP válido com 8 números." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return Response.json(
        { message: "O serviço de CEP está indisponível no momento." },
        { status: 503 },
      );
    }

    const data = await response.json() as ViaCepResponse;

    if (data.erro) {
      return Response.json(
        { message: "Confira o CEP informado e tente novamente." },
        { status: 404 },
      );
    }

    if (!data.localidade || !data.uf) {
      return Response.json(
        { message: "O endereço retornado para este CEP está incompleto." },
        { status: 502 },
      );
    }

    return Response.json(
      {
        street: data.logradouro ?? "",
        district: data.bairro ?? "",
        city: data.localidade,
        state: data.uf,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return Response.json(
      { message: "Não foi possível consultar o CEP agora." },
      { status: 503 },
    );
  }
}
