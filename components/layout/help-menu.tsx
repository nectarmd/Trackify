"use client";

import { useState } from "react";
import { CircleQuestionMark, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Faq = { q: string; a: string; adminOnly?: boolean };

const FAQS: Faq[] = [
  {
    q: "Como registro meu tempo de trabalho?",
    a: "No Rastreador, escreva no que você está trabalhando, escolha o projeto e clique em INICIAR. O cronômetro corre em segundo plano — você pode fechar o app ou trocar de página que ele continua contando. Ao terminar, clique em PARAR e a entrada vai para a lista.",
  },
  {
    q: "Esqueci de ligar o cronômetro. Consigo lançar depois?",
    a: "Sim. No card do Rastreador, clique no ícone de lista (ao lado do cifrão) para trocar do modo cronômetro para o modo manual. Informe o horário de início, o de fim e a data, e clique em Adicionar.",
  },
  {
    q: "Como retomo uma tarefa que já fiz antes?",
    a: "Na lista de entradas, clique no botão ▷ (play) do card. O cronômetro começa na hora, já com a mesma descrição e projeto. O botão vira um pause vermelho ali mesmo, então você para sem precisar subir até o topo.",
  },
  {
    q: "Como corrijo ou apago uma entrada?",
    a: "Passe o mouse na entrada e use o menu ⋮ à direita: Editar (muda descrição, projeto, tags e horários), Duplicar ou Excluir. Você só pode alterar as suas próprias entradas.",
  },
  {
    q: "O que significa o cifrão ($)?",
    a: "Marca a entrada como faturável — ou seja, tempo que será cobrado do cliente. Nos Relatórios você vê o total faturável separado do total geral.",
  },
  {
    q: "Qual a diferença entre Dia, Semana e Mês na lista?",
    a: "É como as entradas ficam agrupadas e qual total aparece à direita. Em Dia, o total é o de hoje; em Semana, o da semana atual; em Mês, o do mês corrente.",
  },
  {
    q: "Por que não vejo Relatórios, Despesas ou outras páginas?",
    a: "O administrador do workspace controla o que cada colaborador acessa. Por padrão, você começa com o Rastreador e a Planilha. Se precisar de mais alguma área, peça a ele para liberar em Configurações.",
  },
  {
    q: "Consigo ver o tempo dos meus colegas?",
    a: "Só se o administrador liberar. Por padrão, cada pessoa enxerga apenas as próprias entradas — no Rastreador, na Planilha e nos relatórios.",
  },
  {
    q: "Como troco minha foto, meu nome ou minha senha?",
    a: "Clique na sua foto no canto superior direito e escolha Perfil. Lá você altera foto, nome de exibição, e-mail e senha.",
  },
  {
    q: "Como adiciono um colaborador?",
    a: "Em Colaboradores, clique em Convidar e informe o e-mail. Depois use o botão de copiar (📋) para enviar a mensagem de convite por WhatsApp. A pessoa precisa criar a conta com exatamente aquele e-mail — é ele que a coloca no seu workspace.",
    adminOnly: true,
  },
  {
    q: "Como defino o que cada colaborador pode acessar?",
    a: "Em Configurações (ícone de engrenagem no topo). Os toggles valem para todos os membros; administradores sempre têm acesso completo. As regras valem no banco de dados, não só nos menus.",
    adminOnly: true,
  },
  {
    q: "Posso lançar horas ou planejar tarefas para um colaborador?",
    a: "Sim. No modo manual do Rastreador aparece o seletor 'Para quem'. No Planejador, o campo 'Para quem' atribui a tarefa — o colaborador vê apenas o que foi atribuído a ele.",
    adminOnly: true,
  },
  {
    q: "Como aviso a equipe sobre alguma coisa?",
    a: "Clique no sininho e depois em Novo. O aviso aparece no sininho de todos os colaboradores do workspace, com um marcador de não lido.",
    adminOnly: true,
  },
];

function Item({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-medium text-slate-800">{faq.q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <p className="pb-3 pr-7 text-sm leading-relaxed text-slate-600">
          {faq.a}
        </p>
      )}
    </div>
  );
}

export function HelpMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const list = FAQS.filter((f) => !f.adminOnly || isAdmin);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ajuda"
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
      >
        <CircleQuestionMark className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Como usar o Trackify</DialogTitle>
          </DialogHeader>
          <div className="-mt-1">
            {list.map((faq) => (
              <Item key={faq.q} faq={faq} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
